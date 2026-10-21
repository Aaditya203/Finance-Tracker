import { requiredAuth } from "@/lib/auth-service";
import { isCompanyBankAccount } from "@/lib/finance";
import { uploadToDrive } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requiredAuth();
    const recordingAccount = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!recordingAccount || !isCompanyBankAccount(recordingAccount)) {
      return NextResponse.json({ error: "Only Flextudy Official can attach bank transaction proof." }, { status: 403 });
    }
    const { id } = await params;
    const transaction = await prisma.bankTransaction.findUnique({ where: { id }, select: { id: true } });
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a receipt or bill to upload." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be 10 MB or smaller." }, { status: 400 });
    }

    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedExtensions.has(extension) || (file.type && !allowedTypes.has(file.type))) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or PDF file." }, { status: 400 });
    }

    const uploaded = await uploadToDrive({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer: Buffer.from(await file.arrayBuffer()),
      folderType: "bank-transactions",
    });
    const attachment = await prisma.attachment.create({
      data: {
        fileName: uploaded.fileName || file.name,
        mimeType: uploaded.mimeType || file.type,
        driveFileId: uploaded.fileId!,
        fileUrl: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.fileId}/view`,
        bankTransactionId: id,
      },
    });
    return NextResponse.json({ message: "Receipt uploaded", attachment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Bank transaction receipt upload error:", error);
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 });
  }
}

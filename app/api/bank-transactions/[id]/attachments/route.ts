import { requiredAuth } from "@/lib/auth-service";
import { isCompanyBankAccount } from "@/lib/finance";
import { sanitizeFileName, uploadToDrive } from "@/lib/google-drive";
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
    const transaction = await prisma.bankTransaction.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNumber: true,
        counterpartyName: true,
        reason: true,
        type: true,
        studentId: true,
        teacherId: true,
      },
    });
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

    let folderName = "Bank Transactions";
    const nameParts: string[] = [];

    if (transaction.invoiceNumber) {
      nameParts.push(transaction.invoiceNumber);
    }

    if (transaction.reason === "TEACHER") {
      folderName = "Teachers";
      if (transaction.teacherId) {
        nameParts.push(transaction.teacherId);
      }
      if (transaction.counterpartyName) {
        nameParts.push(transaction.counterpartyName);
      }
    } else if (transaction.reason === "STUDENT") {
      folderName = "Parents";
      if (transaction.studentId) {
        nameParts.push(transaction.studentId);
      }
      if (transaction.counterpartyName) {
        nameParts.push(transaction.counterpartyName);
      }
    } else if (transaction.reason === "EMPLOYEE") {
      folderName = "Employees";
      if (transaction.counterpartyName) {
        nameParts.push(transaction.counterpartyName);
      }
    } else if (transaction.reason === "DIRECTOR_LOAN_REPAYMENT") {
      folderName = "Director Loan Repayments";
      nameParts.push("DirectorLoan");
      if (transaction.counterpartyName) {
        nameParts.push(transaction.counterpartyName);
      }
    } else {
      folderName = "Bank Transactions";
      if (transaction.counterpartyName) {
        nameParts.push(transaction.counterpartyName);
      }
    }

    const cleanBaseName = nameParts.map(sanitizeFileName).filter(Boolean).join("_");
    const formattedFileName = `${cleanBaseName || "receipt"}${extension}`;

    const uploaded = await uploadToDrive({
      fileName: formattedFileName,
      mimeType: file.type || "application/octet-stream",
      buffer: Buffer.from(await file.arrayBuffer()),
      folderName,
    });
    const attachment = await prisma.attachment.create({
      data: {
        fileName: uploaded.fileName || formattedFileName,
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

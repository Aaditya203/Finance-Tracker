import { requiredAuth } from "@/lib/auth-service";
import { isCompanyBankAccount } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { isWithinTwoDays } from "@/lib/time-limit";
import { NextResponse } from "next/server";

const transactionTypes = ["CREDIT", "DEBIT"] as const;
const reasons = ["STUDENT", "TEACHER", "EMPLOYEE", "DIRECTOR_LOAN_REPAYMENT", "OTHER"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requiredAuth();
    const recordingAccount = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!recordingAccount || !isCompanyBankAccount(recordingAccount)) {
      return NextResponse.json(
        { error: "Only Flextudy Official can edit bank transactions." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.bankTransaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bank transaction not found" }, { status: 404 });
    }

    // 2-Day Edit Window Enforcement (also permits editing if UTR number is missing to allow backfilling)
    const isMissingUtr = !existing.utrNumber || existing.utrNumber.trim() === "";
    if (!isWithinTwoDays(existing.createdAt) && !isMissingUtr) {
      return NextResponse.json(
        {
          error:
            "This transaction was created more than 2 days ago and can no longer be edited.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const invoiceNumber =
      typeof body.invoiceNumber === "string" ? body.invoiceNumber.trim() : existing.invoiceNumber;
    const utrNumber =
      typeof body.utrNumber === "string" ? body.utrNumber.trim() : existing.utrNumber;
    const counterpartyName =
      typeof body.counterpartyName === "string" ? body.counterpartyName.trim() : existing.counterpartyName;
    const amount = body.amount !== undefined ? body.amount : existing.amount;
    const type = body.type ?? existing.type;
    const reason = body.reason ?? existing.reason;
    const transactionDate = body.transactionDate ? new Date(body.transactionDate) : existing.transactionDate;
    const studentId =
      body.studentId !== undefined ? (typeof body.studentId === "string" ? body.studentId.trim() : null) : existing.studentId;
    const teacherId =
      body.teacherId !== undefined ? (typeof body.teacherId === "string" ? body.teacherId.trim() : null) : existing.teacherId;
    const note =
      body.note !== undefined ? (typeof body.note === "string" ? body.note.trim() : null) : existing.note;
    const teacherShare = body.teacherShare !== undefined
      ? Math.max(0, Number.parseInt(String(body.teacherShare), 10) || 0)
      : existing.teacherShare;
    const taxAmount = body.taxAmount !== undefined
      ? Math.max(0, Number.parseInt(String(body.taxAmount), 10) || 0)
      : existing.taxAmount;
    const extraCharges = body.extraCharges !== undefined
      ? Math.max(0, Number.parseInt(String(body.extraCharges), 10) || 0)
      : existing.extraCharges;
    const profitAmount = reason === "STUDENT"
      ? amount - (teacherShare + taxAmount + extraCharges)
      : 0;

    if (!invoiceNumber || invoiceNumber.length > 100 || !counterpartyName || counterpartyName.length > 160) {
      return NextResponse.json({ error: "Enter a valid receipt number and name." }, { status: 400 });
    }

    if (!utrNumber || utrNumber.length > 100) {
      return NextResponse.json({ error: "UTR number is required (up to 100 characters)." }, { status: 400 });
    }

    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2_147_483_647) {
      return NextResponse.json({ error: "Amount must be a positive whole number of rupees." }, { status: 400 });
    }

    if (!transactionTypes.includes(type) || !reasons.includes(reason) || Number.isNaN(transactionDate.getTime())) {
      return NextResponse.json({ error: "Choose a valid transaction type, reason, and date." }, { status: 400 });
    }

    if ((reason === "STUDENT" && !studentId) || (reason === "TEACHER" && !teacherId)) {
      return NextResponse.json({ error: reason === "STUDENT" ? "Student ID is required." : "Teacher ID is required." }, { status: 400 });
    }

    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: {
        invoiceNumber,
        utrNumber,
        counterpartyName,
        amount,
        type,
        reason,
        transactionDate,
        studentId: studentId || null,
        teacherId: teacherId || null,
        teacherShare: reason === "STUDENT" ? teacherShare : 0,
        taxAmount: reason === "STUDENT" ? taxAmount : 0,
        extraCharges: reason === "STUDENT" ? extraCharges : 0,
        profitAmount: reason === "STUDENT" ? profitAmount : 0,
        note,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    return NextResponse.json({
      message: "Bank transaction updated successfully",
      transaction: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Bank transaction update error:", error);
    return NextResponse.json(
      { error: "Failed to update bank transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requiredAuth();
    const recordingAccount = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!recordingAccount || !isCompanyBankAccount(recordingAccount)) {
      return NextResponse.json(
        { error: "Only Flextudy Official can delete bank transactions." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.bankTransaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bank transaction not found" }, { status: 404 });
    }

    // 2-Day Delete Window Enforcement
    if (!isWithinTwoDays(existing.createdAt)) {
      return NextResponse.json(
        {
          error:
            "This transaction was created more than 2 days ago and can no longer be deleted.",
        },
        { status: 400 }
      );
    }

    await prisma.bankTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bank transaction deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Bank transaction delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete bank transaction" },
      { status: 500 }
    );
  }
}

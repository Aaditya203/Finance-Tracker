import { requiredAuth } from "@/lib/auth-service";
import { isCompanyBankAccount } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const transactionTypes = ["CREDIT", "DEBIT"] as const;
const reasons = ["STUDENT", "TEACHER", "EMPLOYEE", "DIRECTOR_LOAN_REPAYMENT", "OTHER"] as const;
const PAGE_SIZE = 10;

export async function GET(request: Request) {
  try {
    await requiredAuth();
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    const scope = params.get("scope") || "all";
    const query = params.get("query")?.trim() || "";
    const type = params.get("type") || "ALL";
    const date = params.get("date") || "";
    const dateStart = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;
    const dateEnd = dateStart ? new Date(dateStart.getTime() + 24 * 60 * 60 * 1000) : null;
    const scopeWhere = scope === "parents" ? { reason: "STUDENT" as const } : scope === "teachers" ? { reason: "TEACHER" as const } : {};
    const where = {
      ...scopeWhere,
      ...(type === "CREDIT" ? { type: "CREDIT" as const } : type === "DEBIT" ? { type: "DEBIT" as const } : {}),
      ...(dateStart && dateEnd ? { transactionDate: { gte: dateStart, lt: dateEnd } } : {}),
      ...(query ? { OR: [
        { counterpartyName: { contains: query, mode: "insensitive" as const } },
        { invoiceNumber: { contains: query, mode: "insensitive" as const } },
        { studentId: { contains: query, mode: "insensitive" as const } },
        { teacherId: { contains: query, mode: "insensitive" as const } },
      ] } : {}),
    };
    const summaryWhere = scopeWhere;
    const [transactions, total, credits, debits, allInScope] = await Promise.all([
      prisma.bankTransaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        createdBy: { select: { id: true, name: true } },
        attachments: {
          select: { id: true, fileName: true, mimeType: true, driveFileId: true, fileUrl: true, createdAt: true },
        },
      },
    }),
      prisma.bankTransaction.count({ where }),
      prisma.bankTransaction.aggregate({ where: { ...summaryWhere, type: "CREDIT" }, _sum: { amount: true } }),
      prisma.bankTransaction.aggregate({ where: { ...summaryWhere, type: "DEBIT" }, _sum: { amount: true } }),
      prisma.bankTransaction.count({ where: summaryWhere }),
    ]);
    return NextResponse.json({
      items: transactions, page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE),
      summary: { credits: credits._sum.amount ?? 0, debits: debits._sum.amount ?? 0, count: allInScope },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Bank transactions API error:", error);
    return NextResponse.json({ error: "Failed to fetch bank transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requiredAuth();
    const recordingAccount = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!recordingAccount || !isCompanyBankAccount(recordingAccount)) {
      return NextResponse.json({ error: "Only Flextudy Official can record bank transactions." }, { status: 403 });
    }
    const body = await request.json();
    const invoiceNumber = typeof body.invoiceNumber === "string" ? body.invoiceNumber.trim() : "";
    const counterpartyName = typeof body.counterpartyName === "string" ? body.counterpartyName.trim() : "";
    const amount = body.amount;
    const type = body.type;
    const reason = body.reason;
    const transactionDate = new Date(body.transactionDate);
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const teacherId = typeof body.teacherId === "string" ? body.teacherId.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!invoiceNumber || invoiceNumber.length > 100 || !counterpartyName || counterpartyName.length > 160) {
      return NextResponse.json({ error: "Enter a valid receipt number and name." }, { status: 400 });
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
    if (studentId.length > 100 || teacherId.length > 100) {
      return NextResponse.json({ error: "Student and teacher IDs must be 100 characters or fewer." }, { status: 400 });
    }
    if (note.length > 2000) {
      return NextResponse.json({ error: "Notes must be 2,000 characters or fewer." }, { status: 400 });
    }

    const transaction = await prisma.bankTransaction.create({
      data: {
        invoiceNumber,
        transactionDate,
        counterpartyName,
        type,
        reason,
        studentId: studentId || null,
        teacherId: teacherId || null,
        amount,
        note: note || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        attachments: true,
      },
    });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That invoice or receipt number is already recorded." }, { status: 409 });
    }
    console.error("Bank transaction create error:", error);
    return NextResponse.json({ error: "Failed to record bank transaction" }, { status: 500 });
  }
}

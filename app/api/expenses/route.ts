import { requiredAuth } from "@/lib/auth-service";
import { SettlementStatus } from "@/app/generated/prisma/enums";
import { isCompanyBankAccount, splitEqually } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const PAGE_SIZE = 10;

export async function GET(request: Request){
    try{
        const { userId } = await requiredAuth();
        const params = new URL(request.url).searchParams;
        const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
        const query = params.get("query")?.trim() || "";
        const paidBy = params.get("paidBy") || "";
        const category = params.get("category") || "";
        const month = params.get("month") || "";
        const monthKey = /^\d{4}-\d{2}$/.test(month)
          ? month
          : /^([A-Za-z]+) (\d{4})$/.test(month)
            ? (() => { const parsed = new Date(`${month} 1`); return Number.isNaN(parsed.getTime()) ? "" : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`; })()
            : "";
        const monthStart = monthKey ? new Date(`${monthKey}-01T00:00:00.000Z`) : null;
        const monthEnd = monthStart ? new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)) : null;
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const where = {
            ...(query ? { OR: [
                { description: { contains: query, mode: "insensitive" as const } },
                { transactionId: { contains: query, mode: "insensitive" as const } },
                { paidBy: { name: { contains: query, mode: "insensitive" as const } } },
            ] } : {}),
            ...(paidBy ? { paidBy: { name: paidBy } } : {}),
            ...(category ? { category } : {}),
            ...(monthStart && monthEnd ? { expenseDate: { gte: monthStart, lt: monthEnd } } : {}),
        };
        const scopeWhere = {};
        const accounts = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
        const bankAccountIds = accounts.filter(isCompanyBankAccount).map(({ id }) => id);
        const [expenses, total, summary, currentMonthSummary, months, deposits, repayments] = await Promise.all([
          prisma.expense.findMany({
            where,
            orderBy:[{ expenseDate:"desc" }, { createdAt:"desc" }, { id:"desc" }],
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select:{
                id:true,
                amountPaid:true,
                transactionId:true,
                description:true,
                category:true,
                bankFundingMode:true,
                isExtraFund:true,
                expenseDate:true,
                createdAt:true,
                updatedAt:true,
                paidBy:{
                    select:{
                        id:true,
                        name:true,
                        email:true
                    }
                },
                splits:{
                   select:{
                    id:true,
                    userId:true,
                    amountPaid:true,
                    isSettled:true,
                    user:{
                        select:{
                            id:true,
                            name:true,
                            email:true
                        }
                    }
                   }
                },
                attachments:{
                    select:{
                        id:true,
                        fileName:true,
                        mimeType:true,
                        driveFileId:true,
                        fileUrl:true,
                        createdAt:true
                    }
                }
            }
        }),
        prisma.expense.count({ where }),
        prisma.expense.aggregate({ where: scopeWhere, _sum: { amountPaid: true }, _count: { _all: true } }),
        prisma.expense.aggregate({ where: { expenseDate: { gte: currentMonthStart, lt: currentMonthEnd } }, _sum: { amountPaid: true } }),
        prisma.$queryRaw<Array<{ month: string }>>`SELECT DISTINCT TO_CHAR("expenseDate", 'YYYY-MM') AS month FROM "Expense" ORDER BY month DESC`,
        prisma.expense.aggregate({ where: { isExtraFund: true, paidById: userId }, _sum: { amountPaid: true } }),
        prisma.settlement.aggregate({
            where: { status: SettlementStatus.COMPLETED, fromUserId: userId, toUserId: { in: bankAccountIds } },
            _sum: { amountPaid: true },
        }),
        ]);

        const contributionTotal = deposits._sum.amountPaid ?? 0;
        const repaymentTotal = repayments._sum.amountPaid ?? 0;
        const applications = await Promise.all(expenses.map(async (expense) => {
          if (expense.isExtraFund || !bankAccountIds.includes(expense.paidBy.id) || expense.bankFundingMode === "POOLED_BANK") return 0;
          const currentShare = expense.splits.find((split) => split.userId === userId)?.amountPaid ?? 0;
          if (!currentShare) return 0;
          const priorShares = await prisma.expenseSplit.aggregate({
            where: {
              userId,
              expense: {
                is: {
                  paidById: { in: bankAccountIds },
                  isExtraFund: false,
                  bankFundingMode: { not: "POOLED_BANK" },
                  OR: [
                    { expenseDate: { lt: expense.expenseDate } },
                    { expenseDate: expense.expenseDate, id: { lt: expense.id } },
                  ],
                },
              },
            },
            _sum: { amountPaid: true },
          });
          const contributionAvailable = Math.max(0, contributionTotal - Math.max(0, (priorShares._sum.amountPaid ?? 0) - repaymentTotal));
          return Math.min(currentShare, contributionAvailable);
        }));

        return NextResponse.json({
          items: expenses.map((expense, index) => ({ ...expense, fundAppliedToCurrentUser: applications[index] })),
          page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE),
          months: months.map(({ month }) => new Date(`${month}-01T12:00:00.000Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })),
          summary: { amount: summary._sum.amountPaid ?? 0, count: summary._count._all, currentMonthAmount: currentMonthSummary._sum.amountPaid ?? 0 },
        });
    }
    catch(error){
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
            );
        }
        console.log(error);
        return NextResponse.json(
            {error:"failed to fetch expenses"},
            {
                status:500
            }
        )
    }
}

export async function POST(request:Request){
    try{
        const auth = await requiredAuth();
        const body = await request.json();
        const {amountPaid, transactionId, description, category, paidById, isExtraFund, expenseDate} = body;
        const bankFundingMode = body.bankFundingMode === "POOLED_BANK" ? "POOLED_BANK" : "PARTNER_SPLIT";
        
        if(typeof amountPaid !== "number" || amountPaid <= 0 || !transactionId || !description){
            return NextResponse.json(
                {error:"Invalid Expense Data"},
                {status:400}
            )
        }

        const effectivePaidById = paidById || auth.userId;

        // Security Enforcement: A user can only create an expense paid by themselves.
        // Impersonating another partner or the bank account is strictly forbidden.
        if (effectivePaidById !== auth.userId) {
            return NextResponse.json(
                { error: "Forbidden: You can only record expenses paid by yourself." },
                { status: 403 }
            );
        }

        const partners = await prisma.user.findMany({
            orderBy: {
                createdAt: "asc"
            },
            select: { id: true, name: true, email: true }
        });

        const humanPartners = partners.filter((partner) => !isCompanyBankAccount(partner));

        if (humanPartners.length === 0) {
            return NextResponse.json(
                { error: "No human partners found to split expense" },
                { status: 400 }
            );
        }

        const payer = partners.find((partner) => partner.id === effectivePaidById);

        if (!payer) {
            return NextResponse.json(
                { error: "Invalid PaidById" },
                { status: 400 }
            );
        }

        // Extra funds are deposits into the company account. A regular expense
        // keeps the account that actually paid it, whether that is the bank or
        // a partner paying personally.
        let splits;
        const bankAccount = partners.find(isCompanyBankAccount);

        if (isExtraFund) {
            if (isCompanyBankAccount(payer)) {
                return NextResponse.json(
                    { error: "The company account cannot add an extra-fund deposit." },
                    { status: 400 }
                );
            }
            const targetUserId = bankAccount?.id;
            if (!targetUserId) {
                return NextResponse.json(
                    { error: "Company bank account not found. Add the FlexStudy bank account before recording a deposit." },
                    { status: 400 }
                );
            }
            splits = [{ userId: targetUserId, amountPaid }];
        } else {
            if (bankFundingMode === "POOLED_BANK" && !isCompanyBankAccount(payer)) {
                return NextResponse.json({ error: "Pooled bank cash can only be selected for expenses paid by the official bank account." }, { status: 400 });
            }
            splits = bankFundingMode === "POOLED_BANK"
                ? []
                : splitEqually(amountPaid, humanPartners.map((partner) => partner.id));
        }

        const parsedExpenseDate = expenseDate ? new Date(expenseDate) : new Date();
        if (Number.isNaN(parsedExpenseDate.getTime())) {
            return NextResponse.json({ error: "Invalid expense date" }, { status: 400 });
        }
        
        const expense = await prisma.expense.create({
            data:{
                amountPaid,
                transactionId,
                description,
                category:category || null,
                isExtraFund: isExtraFund || false,
                bankFundingMode,
                paidById: effectivePaidById,
                expenseDate: parsedExpenseDate,
                splits:{
                    create:splits
                }
            },

            include:{
                paidBy:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                splits:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true
                            }
                        }
                    }
                }
            }
        })
        return NextResponse.json(expense);

    }
    catch(error){
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        console.log(error);
        return NextResponse.json(
            {error:"Failed to create Expense"},
            {
                status:500
            }
        )
    }
}

import { requiredAuth } from "@/lib/auth-service";
import { isCompanyBankAccount, splitEqually } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { isWithinTwoDays } from "@/lib/time-limit";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requiredAuth();
    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        splits: true,
        paidBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // 2-Day Edit Window Enforcement
    if (!isWithinTwoDays(expense.createdAt)) {
      return NextResponse.json(
        {
          error:
            "This transaction was created more than 2 days ago and can no longer be edited.",
        },
        { status: 400 }
      );
    }

    // Permission check: only the payer can edit their expense
    if (expense.paidById !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit expenses recorded by you." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { description, category, expenseDate } = body;
    const amountPaid = typeof body.amountPaid === "number" ? body.amountPaid : undefined;
    const bankFundingMode =
      body.bankFundingMode === "POOLED_BANK" ? "POOLED_BANK" : body.bankFundingMode === "PARTNER_SPLIT" ? "PARTNER_SPLIT" : undefined;

    if (amountPaid !== undefined && (amountPaid <= 0 || !Number.isSafeInteger(amountPaid))) {
      return NextResponse.json(
        { error: "Amount must be a positive whole number of rupees." },
        { status: 400 }
      );
    }

    if (description !== undefined && (!description || typeof description !== "string" || !description.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid expense description." },
        { status: 400 }
      );
    }

    let parsedExpenseDate = expense.expenseDate;
    if (expenseDate) {
      const parsed = new Date(expenseDate);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid expense date" }, { status: 400 });
      }
      parsedExpenseDate = parsed;
    }

    const newAmount = amountPaid ?? expense.amountPaid;
    const newFundingMode = bankFundingMode ?? expense.bankFundingMode;
    const recalculateSplits =
      (amountPaid !== undefined && amountPaid !== expense.amountPaid) ||
      (bankFundingMode !== undefined && bankFundingMode !== expense.bankFundingMode);

    const updatedExpense = await prisma.$transaction(async (tx) => {
      if (recalculateSplits) {
        let newSplits: Array<{ userId: string; amountPaid: number }> = [];

        if (expense.isExtraFund) {
          const partners = await tx.user.findMany({ select: { id: true, name: true, email: true } });
          const bankAccount = partners.find(isCompanyBankAccount);
          if (!bankAccount) {
            throw new Error("Company bank account not found");
          }
          newSplits = [{ userId: bankAccount.id, amountPaid: newAmount }];
        } else if (newFundingMode === "POOLED_BANK") {
          newSplits = [];
        } else {
          const partners = await tx.user.findMany({
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, email: true },
          });
          const humanPartners = partners.filter((p) => !isCompanyBankAccount(p));
          newSplits = splitEqually(
            newAmount,
            humanPartners.map((p) => p.id)
          );
        }

        await tx.expenseSplit.deleteMany({ where: { expenseId: id } });

        return tx.expense.update({
          where: { id },
          data: {
            description: description !== undefined ? description.trim() : expense.description,
            category: category !== undefined ? (category ? category.trim() : null) : expense.category,
            amountPaid: newAmount,
            bankFundingMode: newFundingMode,
            expenseDate: parsedExpenseDate,
            splits: {
              create: newSplits,
            },
          },
          include: {
            splits: { include: { user: { select: { id: true, name: true } } } },
            paidBy: { select: { id: true, name: true, email: true } },
            attachments: true,
          },
        });
      } else {
        return tx.expense.update({
          where: { id },
          data: {
            description: description !== undefined ? description.trim() : expense.description,
            category: category !== undefined ? (category ? category.trim() : null) : expense.category,
            expenseDate: parsedExpenseDate,
          },
          include: {
            splits: { include: { user: { select: { id: true, name: true } } } },
            paidBy: { select: { id: true, name: true, email: true } },
            attachments: true,
          },
        });
      }
    });

    return NextResponse.json({
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Expense update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update expense" },
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
    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // 2-Day Delete Window Enforcement
    if (!isWithinTwoDays(expense.createdAt)) {
      return NextResponse.json(
        {
          error:
            "This transaction was created more than 2 days ago and can no longer be deleted.",
        },
        { status: 400 }
      );
    }

    // Permission check: only the payer can delete their expense
    if (expense.paidById !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete expenses recorded by you." },
        { status: 403 }
      );
    }

    // Delete from database (Prisma schema cascades splits and attachments)
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Expense delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}

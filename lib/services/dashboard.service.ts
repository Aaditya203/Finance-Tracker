import { SettlementStatus } from "@/app/generated/prisma/enums";
import { calculateCompanyCash, calculateCourseEconomics, calculateExtraFundApplications, calculateLedgerBalances, suggestPartnerSettlements } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { DashboardBalanceItem, DashboardDataResponse, MonthlyExpenseAggregate } from "@/types";


export async function getDashboardData(userId?: string):Promise<DashboardDataResponse> {
  const currentYear = new Date().getFullYear();



  const [users,
    ledgerExpenses,
    ledgerSettlements,
    recentExpenses,
    recentSettlements,
    pendingSettlements,
    bankTransactions] = await Promise.all([
      //1. All users for balance map
      prisma.user.findMany({
        select:{id:true,name:true,email:true},
        orderBy:{createdAt:"asc"}
      }),

      prisma.expense.findMany({
        select:{
          id:true,
          description:true,
          createdAt:true,
          expenseDate:true,
          amountPaid:true,
          paidById:true,
          isExtraFund:true,
          bankFundingMode:true,
          splits:{select:{userId:true,amountPaid:true}},
        },
      }),

      prisma.settlement.findMany({
        select:{fromUserId:true,toUserId:true,amountPaid:true,status:true},
      }),

      prisma.expense.findMany({
        take:5,
        orderBy:{createdAt:"desc"},
        select:{
          id:true,
          description:true,
          amountPaid:true,
          transactionId:true,
          category:true,
          isExtraFund:true,
          bankFundingMode:true,
          expenseDate:true,
          createdAt:true,
          paidBy:{select:{id:true,name:true,email:true}},
          splits:{select:{userId:true,amountPaid:true,user:{select:{id:true,name:true}}}},
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
      prisma.settlement.findMany({
        take:5,
        orderBy:{settledAt:"desc"},
        select:{
          id:true,
          amountPaid:true,
          status:true,
          settledAt:true,
          createdAt:true,
          fromUser:{select:{id:true,name:true,email:true}},
          toUser:{select:{id:true,name:true,email:true}},
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
      
      prisma.settlement.findMany({
        where:{
          toUserId:userId,
          status:SettlementStatus.PENDING,
        },
        select:{
          id:true,
          amountPaid:true,
          status:true,
          settledAt:true,
          createdAt:true,
          fromUser:{select:{id:true,name:true,email:true}},
          toUser:{select:{id:true,name:true,email:true}},
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
        },
        orderBy:{createdAt:"desc"}
      }),
      prisma.bankTransaction.findMany({
        select: {
          id: true,
          type: true,
          amount: true,
          reason: true,
          studentId: true,
          teacherId: true,
          teacherShare: true,
          taxAmount: true,
          extraCharges: true,
          profitAmount: true,
          transactionDate: true,
          createdAt: true,
        },
      })
    ])

  const balance:DashboardBalanceItem[] = calculateLedgerBalances(users, ledgerExpenses, ledgerSettlements);
  const settlementPlan = suggestPartnerSettlements(balance, ledgerSettlements);
  const fundApplications = calculateExtraFundApplications(users, ledgerExpenses, ledgerSettlements);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyExpenses: MonthlyExpenseAggregate[] = MONTHS.map((month) => ({
    month,
    amount: 0,
    count: 0,
  }));
  let totalSpent = 0;
  let totalInvestment = 0;
  let userContribution = 0;
  const totalSpentByMonth: Record<string, number> = {};
  const totalInvestmentByMonth: Record<string, number> = {};
  
  for (const expense of ledgerExpenses) {
    const expDate = new Date(expense.expenseDate);
    const monthIndex = expDate.getMonth();
    const monthKey = Number.isNaN(expDate.getTime())
      ? "Unknown"
      : expDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (expense.isExtraFund) {
      totalInvestment += expense.amountPaid;
      totalInvestmentByMonth[monthKey] = (totalInvestmentByMonth[monthKey] || 0) + expense.amountPaid;
      if (userId && expense.paidById === userId) {
        userContribution += expense.amountPaid;
      }
    } else {
      if (expDate.getFullYear() === currentYear) {
        monthlyExpenses[monthIndex].amount += expense.amountPaid;
        monthlyExpenses[monthIndex].count = (monthlyExpenses[monthIndex].count || 0) + 1;
      }
      totalSpent += expense.amountPaid;
      totalSpentByMonth[monthKey] = (totalSpentByMonth[monthKey] || 0) + expense.amountPaid;
      if (userId && expense.paidById === userId) {
        userContribution += expense.amountPaid;
      }
    }
  }

  const companyCash = calculateCompanyCash(users, ledgerExpenses, ledgerSettlements, bankTransactions);
  const companyReceivables = balance.reduce((total, partner) => total + partner.companyDue, 0);
  const teacherLiabilities = calculateCourseEconomics(bankTransactions, companyCash.cashPosition);

  return {
    summary: {
      totalSpent,
      totalInvestment,
      bankPaidExpenses: companyCash.bankPaidExpenses,
      extraFundsRemaining: companyCash.cashPosition,
      otherBankCredits: companyCash.otherCredits,
      otherBankDebits: companyCash.otherDebits,
      companyReceivables,
      userContribution,
      balance,
      settlementPlan,
      monthlyExpenses,
      teacherLiabilities,
      totalSpentByMonth,
      totalInvestmentByMonth,
    },
    expenses: recentExpenses.map((expense) => ({
      ...expense,
      fundAppliedToCurrentUser: userId ? fundApplications[expense.id]?.[userId] ?? 0 : 0,
    })),
    settlements: recentSettlements,
    pendingSettlements
  };
}

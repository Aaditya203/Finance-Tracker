import { SettlementStatus } from "@/app/generated/prisma/enums";
import { calculateCompanyCash, calculateExtraFundApplications, calculateLedgerBalances, suggestPartnerSettlements } from "@/lib/finance";
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
          type: true,
          amount: true,
          reason: true,
          teacherShare: true,
          taxAmount: true,
          extraCharges: true,
          profitAmount: true,
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
  
  for (const expense of ledgerExpenses) {
    const expDate = new Date(expense.expenseDate);
    const monthIndex = expDate.getMonth();
    if (expense.isExtraFund) {
      totalInvestment += expense.amountPaid;
      if (userId && expense.paidById === userId) {
        userContribution += expense.amountPaid;
      }
    } else {
      if (expDate.getFullYear() === currentYear) {
        monthlyExpenses[monthIndex].amount += expense.amountPaid;
        monthlyExpenses[monthIndex].count = (monthlyExpenses[monthIndex].count || 0) + 1;
      }
      totalSpent += expense.amountPaid;
      if (userId && expense.paidById === userId) {
        userContribution += expense.amountPaid;
      }
    }
  }

  let totalStudentFees = 0;
  let totalTeacherCommitted = 0;
  let totalTeacherPaid = 0;
  let totalTaxCollected = 0;
  let totalExtraCharges = 0;
  let overallCourseProfit = 0;

  for (const bt of bankTransactions) {
    if (bt.reason === "STUDENT") {
      totalStudentFees += bt.amount;
      totalTeacherCommitted += bt.teacherShare || 0;
      totalTaxCollected += bt.taxAmount || 0;
      totalExtraCharges += bt.extraCharges || 0;
      overallCourseProfit += bt.profitAmount || (bt.amount - (bt.teacherShare || 0) - (bt.taxAmount || 0) - (bt.extraCharges || 0));
    } else if (bt.reason === "TEACHER" && bt.type === "DEBIT") {
      totalTeacherPaid += bt.amount;
    }
  }

  const pendingTeacherPayable = Math.max(0, totalTeacherCommitted - totalTeacherPaid);
  const companyCash = calculateCompanyCash(users, ledgerExpenses, ledgerSettlements, bankTransactions);
  const companyReceivables = balance.reduce((total, partner) => total + partner.companyDue, 0);
  const safeSpendableCash = Math.max(0, companyCash.cashPosition - pendingTeacherPayable);

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
      teacherLiabilities: {
        totalStudentFees,
        totalTeacherCommitted,
        totalTeacherPaid,
        pendingTeacherPayable,
        totalTaxCollected,
        totalExtraCharges,
        overallCourseProfit,
        safeSpendableCash,
      },
    },
    expenses: recentExpenses.map((expense) => ({
      ...expense,
      fundAppliedToCurrentUser: userId ? fundApplications[expense.id]?.[userId] ?? 0 : 0,
    })),
    settlements: recentSettlements,
    pendingSettlements
  };
}

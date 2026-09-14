import { SettlementStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { DashboardBalanceItem, DashboardDataResponse, MonthlyExpenseAggregate } from "@/types";


export async function getDashboardData(userId?: string):Promise<DashboardDataResponse> {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear,0,1);
  const yearEnd = new Date(currentYear+1,0,1);



  const [users,
    expensePaidAggregates,
    expenseSplitAggregates,
    settlementSentAggregates,
    settlementReceivedAggregates,
    monthlyTotals,
    recentExpenses,
    recentSettlements,
    pendingSettlements] = await Promise.all([
      //1. All users for balance map
      prisma.user.findMany({
        select:{id:true,name:true},
        orderBy:{createdAt:"asc"}
      }),

      //2. Total Paid per user
      prisma.expense.groupBy({
        by:['paidById'],
        _sum:{amountPaid:true}
      }),

      prisma.expenseSplit.groupBy
      ({
        by:['userId'],
        _sum:{amountPaid:true}
      }),

      prisma.settlement.groupBy({
        by:['fromUserId'],
        where:{status:SettlementStatus.COMPLETED},
        _sum:{amountPaid:true}
      }),

      prisma.settlement.groupBy({
        by:['toUserId'],
        where:{status:SettlementStatus.COMPLETED},
        _sum:{amountPaid:true},
      }),

      prisma.expense.findMany({
        where:{
          expenseDate:{gte:yearStart,lt:yearEnd},
        },
        select:{expenseDate:true,amountPaid:true,paidById:true},
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
          expenseDate:true,
          paidBy:{select:{id:true,name:true,email:true}},
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
      })
    ])

    const paidByMap = new Map(expensePaidAggregates.map((r)=>[r.paidById,r._sum.amountPaid ?? 0]));
    const shareMap = new Map(expenseSplitAggregates.map((r)=>[r.userId,r._sum.amountPaid ?? 0]));
    const sentMap = new Map(settlementSentAggregates.map((r)=>[r.fromUserId,r._sum.amountPaid ?? 0]));
    const receivedMap = new Map(settlementReceivedAggregates.map((r)=>[r.toUserId,r._sum.amountPaid ?? 0]))

  // Compute balance
  const balance:DashboardBalanceItem[] = users.map((user) => {
    const totalPaid = paidByMap.get(user.id) ?? 0;
    const totalShare = shareMap.get(user.id) ?? 0;
    const moneySpent = sentMap.get(user.id) ?? 0;
    const moneyReceived = receivedMap.get(user.id) ?? 0;

    return {
      userId: user.id,
      name: user.name,
      totalPaid,
      totalShare,
      moneySpent,
      moneyReceived,
      balance: totalPaid - totalShare + moneySpent - moneyReceived,
    };
  });

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyExpenses:MonthlyExpenseAggregate[] = MONTHS.map((month)=>({month,amount:0}));
  let totalSpent = 0;
  let userContribution = 0;
  
  for (const expense of monthlyTotals) {
    const monthIndex = expense.expenseDate.getMonth();
    monthlyExpenses[monthIndex].amount += expense.amountPaid;
    totalSpent += expense.amountPaid;
    if (userId && expense.paidById === userId) {
      userContribution += expense.amountPaid;
    }
  }
  return {
    summary: {
      totalSpent,
      userContribution,
      balance,
      monthlyExpenses,
    },
    expenses: recentExpenses,
    settlements: recentSettlements,
    pendingSettlements
  };
}

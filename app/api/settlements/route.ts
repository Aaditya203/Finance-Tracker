import { SettlementStatus } from "@/app/generated/prisma/enums";
import { requiredAuth } from "@/lib/auth-service";
import { calculateLedgerBalances, getSettlementAllowance, isCompanyBankAccount } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        await requiredAuth();
        const settlements = await prisma.settlement.findMany({
          include:{
            fromUser:{
                select:{
                    id:true,
                    name:true
                }
            },
            toUser:{
                select:{
                    id:true,
                    name:true
                }
            },
            attachments:true,
          },
          orderBy:{
            settledAt:"desc"
          }
        })
        return NextResponse.json(settlements)
    }
    catch(error){
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(error);
        return NextResponse.json({
            error:"Failed to fetch settlements"
        },{
            status:500
        })
    }
}

export async function POST(request:Request){
    try{
        const {userId:fromUserId}= await requiredAuth();
        const body = await request.json();

        const { toUserId, amountPaid: bodyAmountPaid, amount: bodyAmount } = body;
        const amount = bodyAmountPaid ?? bodyAmount;

        if (!toUserId || typeof amount !== "number" || amount <= 0 || Number.isNaN(amount)) {
            return NextResponse.json(
                { error: "Invalid Settlement Data" },
                {
                    status: 400
                }
            );
        }

        if(fromUserId === toUserId){
            return NextResponse.json(
                {error:"A user cannot settle with themselves"},
                {
                    status:400
                }
            )
        }
        const [toUser, users, expenses, completedSettlements, pendingSettlements] = await Promise.all([
            prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } }),
            prisma.user.findMany({ select: { id: true, name: true, email: true } }),
            prisma.expense.findMany({
                select: {
                    paidById: true,
                    amountPaid: true,
                    isExtraFund: true,
                    splits: { select: { userId: true, amountPaid: true } },
                },
            }),
            prisma.settlement.findMany({
                where: { status: SettlementStatus.COMPLETED },
                select: { fromUserId: true, toUserId: true, amountPaid: true, status: true },
            }),
            prisma.settlement.findMany({
                where: { status: SettlementStatus.PENDING },
                select: { fromUserId: true, toUserId: true, amountPaid: true },
            }),
        ]);

        if(!toUser){
            return NextResponse.json(
                {
                    error:"Settlement partner not found"
                },
                {
                    status:404
                }
            )
        }
        const amountPaid = Math.round(amount);
        const balances = calculateLedgerBalances(users, expenses, completedSettlements);
        const maximumAllowed = getSettlementAllowance(
            balances,
            pendingSettlements,
            fromUserId,
            toUserId,
            users.filter(isCompanyBankAccount).map((user) => user.id)
        );

        if (maximumAllowed <= 0) {
            return NextResponse.json(
                { error: "There is no outstanding balance to settle with this account." },
                { status: 400 }
            );
        }
        if (amountPaid > maximumAllowed) {
            return NextResponse.json(
                { error: `Settlement exceeds the outstanding amount. You can record up to ₹${maximumAllowed.toLocaleString("en-IN")}.` },
                { status: 400 }
            );
        }
        
        const settlement = await prisma.settlement.create({
            data:{
                fromUserId,
                toUserId,
                amountPaid,
                status: SettlementStatus.PENDING,
            },
            select:{
                id:true,
                amountPaid:true,
                status:true,
                createdAt:true,
                settledAt:true,
                fromUser:{
                    select:{
                        id:true,
                        name:true,
                    }
                },
                toUser:{
                    select:{
                        id:true,
                        name:true
                    }
                }
            }
        })

        return NextResponse.json(settlement)

        
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
            {error:"Failed to create settlement"},
            {
                status:500
            }
        )
    }
}

import { SettlementStatus } from "@/app/generated/prisma/enums";
import { requiredAuth } from "@/lib/auth-service";
import { calculateLedgerBalances, getSettlementAllowance, isCompanyBankAccount } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

class SettlementValidationError extends Error {}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
   try{
        const { userId } = await requiredAuth();
       const {id:settlementId} = await params;

       
        if(!userId){
            return NextResponse.json({error:"Not Logged In!"},{status:400});
        }

        const updatedSettlement = await prisma.$transaction(async (tx) => {
            const settlement = await tx.settlement.findUnique({ where: { id: settlementId } });
            if (!settlement) throw new SettlementValidationError("Settlement not found");
            if (settlement.toUserId !== userId) {
                throw new SettlementValidationError("You are not authorized to confirm this settlement.");
            }
            if (settlement.status !== SettlementStatus.PENDING) {
                throw new SettlementValidationError("Only pending settlements can be confirmed.");
            }

            const [users, expenses, completedSettlements, pendingSettlements] = await Promise.all([
                tx.user.findMany({ select: { id: true, name: true, email: true } }),
                tx.expense.findMany({
                    select: {
                        paidById: true,
                        amountPaid: true,
                        isExtraFund: true,
                        splits: { select: { userId: true, amountPaid: true } },
                    },
                }),
                tx.settlement.findMany({
                    where: { status: SettlementStatus.COMPLETED },
                    select: { fromUserId: true, toUserId: true, amountPaid: true, status: true },
                }),
                tx.settlement.findMany({
                    where: { status: SettlementStatus.PENDING, id: { not: settlement.id } },
                    select: { fromUserId: true, toUserId: true, amountPaid: true },
                }),
            ]);

            const maximumAllowed = getSettlementAllowance(
                calculateLedgerBalances(users, expenses, completedSettlements),
                pendingSettlements,
                settlement.fromUserId,
                settlement.toUserId,
                users.filter(isCompanyBankAccount).map((user) => user.id)
            );
            if (settlement.amountPaid > maximumAllowed) {
                throw new SettlementValidationError("This payment no longer matches the outstanding balance.");
            }

            return tx.settlement.update({
                where:{id:settlementId},
                data:{
                    status:SettlementStatus.COMPLETED,
                    settledAt:new Date()
                },
                include:{
                    fromUser:{select:{id:true,name:true}},
                    toUser:{select:{id:true,name:true}},
                    attachments:true
                }
            });
        });
        return NextResponse.json({message:"Settlement confirmed successfully",updatedSettlement})
   }
   catch(error){
    if(error instanceof Error && error.message === "UNAUTHORIZED"){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }
    if (error instanceof SettlementValidationError) {
        const status = error.message === "Settlement not found" ? 404 : 400;
        return NextResponse.json({ error: error.message }, { status });
    }
    console.log(error);
    return NextResponse.json({error:"Failed to confirm settlement"},{status:500})
   }
}

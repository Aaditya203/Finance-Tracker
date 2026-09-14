import { SettlementStatus } from "@/app/generated/prisma/enums";
import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(){
    try{
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
        const toUser = await prisma.user.findUnique({
            where:{
                id:toUserId,
            },
            select:{
                id:true,
            }
        })

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

        return NextResponse.json({
            settlement
        })

        
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
import { SettlementStatus } from "@/app/generated/prisma/enums";
import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request:Request,{params}:{params:Promise<{userId:string}>}){
    try{
        const { userId: authenticatedUserId } = await requiredAuth();
        const {userId} = await params;
        if(!userId){
            return NextResponse.json({
                error:"userId is required"
            },{
                status:404
            })
        }

        if (authenticatedUserId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where:{
                id:userId
            }
        })
        if(!user){
            return NextResponse.json({
                error:"user not found"
            },{
                status:404
            })
        }

        const settlements = await prisma.settlement.findMany({
            where:{
                toUserId:userId,
                status:SettlementStatus.PENDING
            },
            include:{
                fromUser:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                    }
                },
                toUser:{
                    select:{
                        id:true,
                        name:true,
                        email:true,
                    }
                },
                attachments:true,
                
            },
            orderBy:{
                createdAt:"desc"
            }
           
        })
        return NextResponse.json({
            count:settlements.length,
            settlements
        })
        
    }
    catch(error){
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(error);
        return NextResponse.json({
            error:"Failed to fetch pending settlements"
        },{
            status:500
        })
    }
}

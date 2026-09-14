import { SettlementStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request:Request,{params}:{params:Promise<{userId:string}>}){
    try{
        const {userId} = await params;
        if(!userId){
            return NextResponse.json({
                error:"userId is required"
            },{
                status:404
            })
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
        console.log(error);
        return NextResponse.json({
            error:"Failed to fetch pending settlements"
        },{
            status:500
        })
    }
}

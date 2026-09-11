import { SettlementStatus } from "@/app/generated/prisma/enums";
import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
    try{
        const {userId} = await requiredAuth();
        const {id:settlementId} = await params;
        if(!userId){
            NextResponse.json({
                error:"Not Logged In!",
            },{
                status:400
            })
        }
        const settlement = await prisma.settlement.findUnique({
            where:{
                id:settlementId,
            }
        })

        if(!settlement){
            return NextResponse.json({
                error:"Settlement not found",
            },{
                status:404
            })
        }

        if(settlement.toUserId!==userId){
            return NextResponse.json({
                error:"You are not authorized to reject this settlement!",
            },{
                status:400
            })
        }

        if(settlement.status !== SettlementStatus.PENDING){
            return NextResponse.json({
                error:"Settlement is not in pending status!"
            },{
                status:400
            })
        }

        const updatedSettlement = await prisma.settlement.update({
            where:{
                id:settlementId
            },
            data:{
                status:SettlementStatus.CANCELLED
            },
            include:{
                fromUser:{
                    select:{
                        id:true,
                        name:true,
                    }
                },
                toUser:{
                    select:{
                        id:true,
                        name:true,
                    }
                },
                attachments:true
            }
        })
        
        return NextResponse.json({
            message:"Settlement rejected successfully",
            settlement:updatedSettlement
        })

    }
    catch(error){
        if(error instanceof Error && error.message === "UNAUTHORIZED"){
            return NextResponse.json({
                error:"Unauthorized",
            },{
                status:401
            })
        }
        console.log(error);
        return NextResponse.json({
            error:"Failed to reject settlement"
        },{
            status:500
        })
    }
}

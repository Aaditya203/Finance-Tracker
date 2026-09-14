import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        await requiredAuth();
        const expenses = await prisma.expense.findMany({
            orderBy:{
                createdAt:"desc"
            },
            select:{
                id:true,
                amountPaid:true,
                transactionId:true,
                description:true,
                category:true,
                expenseDate:true,
                createdAt:true,
                updatedAt:true,
                paidBy:{
                    select:{
                        id:true,
                        name:true,
                        email:true
                    }
                },
                splits:{
                   select:{
                    id:true,
                    userId:true,
                    amountPaid:true,
                    isSettled:true,
                    user:{
                        select:{
                            id:true,
                            name:true,
                            email:true
                        }
                    }
                   }
                },
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
        })

        return NextResponse.json(expenses);
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
            {error:"failed to fetch expenses"},
            {
                status:500
            }
        )
    }
}

export async function POST(request:Request){
    try{
        const body = await request.json();
        const {amountPaid,transactionId,description,category,paidById} = body;
        
        if(typeof amountPaid !== "number" || amountPaid <= 0 || !transactionId || !description || !paidById){
            return NextResponse.json(
                {error:"Invalid Expense Data"},
                {status:400}
            )
        }

        const partners = await prisma.user.findMany({
            orderBy:{
                createdAt:"asc"
            }
        })

        if(partners.length!==3){
            return NextResponse.json(
                {error:"there should be 3 partners"},
                {status:400}
            )
        }

        const payer = partners.find((p)=> p.id === paidById);

        if(!payer){
            return NextResponse.json(
                {error:"Invalid PaidById"},
                {status:400}
            )
        }

        const baseShare = Math.floor(amountPaid/3);
        const remainder = amountPaid % 3;
        
        const splits = partners.map((partner,index) => ({
            userId:partner.id,
            amountPaid:baseShare + (index < remainder ? 1:0)
        }));
        
        const expense = await prisma.expense.create({
            data:{
                amountPaid,
                transactionId,
                description,
                category:category || null,
                paidById,
                splits:{
                    create:splits
                }
            },

            include:{
                paidBy:{
                    select:{
                        id:true,
                        name:true
                    }
                },
                splits:{
                    include:{
                        user:{
                            select:{
                                id:true,
                                name:true
                            }
                        }
                    }
                }
            }
        })
        return NextResponse.json(expense);

    }
    catch(error){
        console.log(error);
        return NextResponse.json(
            {error:"Failed to create Expense"},
            {
                status:500
            }
        )
    }
}
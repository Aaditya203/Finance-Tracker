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
                isExtraFund:true,
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
        const auth = await requiredAuth();
        const body = await request.json();
        const {amountPaid,transactionId,description,category,paidById,isExtraFund} = body;
        
        if(typeof amountPaid !== "number" || amountPaid <= 0 || !transactionId || !description){
            return NextResponse.json(
                {error:"Invalid Expense Data"},
                {status:400}
            )
        }

        const effectivePaidById = paidById || auth.userId;

        // Security Enforcement: A user can only create an expense paid by themselves.
        // Impersonating another partner or the bank account is strictly forbidden.
        if (effectivePaidById !== auth.userId) {
            return NextResponse.json(
                { error: "Forbidden: You can only record expenses paid by yourself." },
                { status: 403 }
            );
        }

        const partners = await prisma.user.findMany({
            orderBy: {
                createdAt: "asc"
            }
        });

        const humanPartners = partners.filter(
            (p) => p.name.toLowerCase() !== "flextudy" && p.email?.toLowerCase() !== "flextudy6@gmail.com"
        );

        if (humanPartners.length === 0) {
            return NextResponse.json(
                { error: "No human partners found to split expense" },
                { status: 400 }
            );
        }

        const payer = partners.find((p) => p.id === effectivePaidById);

        if (!payer) {
            return NextResponse.json(
                { error: "Invalid PaidById" },
                { status: 400 }
            );
        }

        // Extra Fund: Payer is the user, target is Flextudy
        // Regular Expense: Payer is Flextudy, targets are all human partners
        let splits;
        let finalPaidById = effectivePaidById;
        const flextudyUser = partners.find(
            (p) => p.name.toLowerCase() === "flextudy" || p.email?.toLowerCase() === "flextudy6@gmail.com"
        );

        if (isExtraFund) {
            const targetUserId = flextudyUser ? flextudyUser.id : effectivePaidById;
            splits = [{ userId: targetUserId, amountPaid }];
        } else {
            if (flextudyUser) {
                finalPaidById = flextudyUser.id; // Bank pays for all regular expenses
            }
            const baseShare = Math.floor(amountPaid / humanPartners.length);
            const remainder = amountPaid % humanPartners.length;
            splits = humanPartners.map((partner, index) => ({
                userId: partner.id,
                amountPaid: baseShare + (index < remainder ? 1 : 0)
            }));
        }
        
        const expense = await prisma.expense.create({
            data:{
                amountPaid,
                transactionId,
                description,
                category:category || null,
                isExtraFund: isExtraFund || false,
                paidById: finalPaidById,
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
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        console.log(error);
        return NextResponse.json(
            {error:"Failed to create Expense"},
            {
                status:500
            }
        )
    }
}
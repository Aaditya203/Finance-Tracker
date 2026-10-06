import { requiredAuth } from "@/lib/auth-service";
import { uploadToDrive } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf"
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
];

export async function POST(request:Request,{ params }: { params: Promise<{ id: string }> }){
    try{
        const auth = await requiredAuth();
        const {id:expenseId} = await params;
        const expense = await prisma.expense.findUnique({
            where:{
                id:expenseId
            }
        })
        if(!expense){
            return NextResponse.json({
                error:"Expense not found"
            },{status:404})
        }

        if (expense.paidById !== auth.userId) {
            return NextResponse.json({
                error: "Forbidden: Only the expense payer can attach documents"
            }, { status: 403 });
        }
        
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if(!file){
            return NextResponse.json({
                error:"No File Is Uploaded!"
            },{
                status:400
            })
        }

        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

        const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(extension);

        if(!isValid){
            return NextResponse.json({
                error:"Invalid file type!"
            },{status:400})
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadedFile = await uploadToDrive({
            fileName:file.name,
            mimeType:file.type,
            buffer:buffer,
            folderType:"expenses",
        })

        const attachment = await prisma.attachment.create({
            data:{
                fileName:uploadedFile.fileName || file.name,
                mimeType:uploadedFile.mimeType||file.type,
                driveFileId:uploadedFile.fileId!,
                fileUrl:uploadedFile.webViewLink!,
                expenseId:expenseId,
                
            }
        })

        return NextResponse.json({
            message:"Attachment uploaded successfully",
            attachment,
        },{
            status:200
        })
    
    }catch(error){
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        console.log("Error In Uploading Attachment",error);
        return NextResponse.json({
            message:"Failed to upload attachment"
        },{status:500})
    }
    }


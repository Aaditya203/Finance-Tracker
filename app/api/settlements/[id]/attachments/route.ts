import { requiredAuth } from "@/lib/auth-service";
import { uploadToDrive } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
];

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
    try{
        const auth = await requiredAuth();
        const {id:settlementId} = await params;
        const settlement = await prisma.settlement.findUnique({
            where:{
                id:settlementId,
            }
        })

        if(!settlement){
            return NextResponse.json({
                error:"Settlement Not Found"
            },{
                status:404
            })
        }

        if (settlement.fromUserId !== auth.userId) {
            return NextResponse.json(
                { error: "Forbidden: Only the payer can attach settlement proof" },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if(!file){
            return NextResponse.json({
                error:"No File Is Uploaded"
            },{
                status:400
            })
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File must be 10 MB or smaller" }, { status: 400 });
        }

        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

        const isValid = allowedTypes.includes(file.type) || allowedExtensions.includes(extension);

        if(!isValid){
            return NextResponse.json({
                error:"Invalid File Type"
            },{
                status:400
            })
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadedFile = await uploadToDrive({
            fileName:file.name, 
            mimeType:file.type,
            buffer:buffer,
            folderType:"settlements",
        })

        const attachment = await prisma.attachment.create({
            data:{
                fileName:uploadedFile.fileName || file.name,
                mimeType:uploadedFile.mimeType || file.type,
                driveFileId:uploadedFile.fileId!,
                fileUrl:uploadedFile.webViewLink!,
                settlementId:settlementId,
            }
        })
        return NextResponse.json({
            message:"Attachment Uploaded Successfully",
            attachment,
        },{
            status:200
        })
    }catch(error){
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log("Error In Uploading Attachment",error);
        return NextResponse.json({
            message:"Failed to upload attachment",
        },{
            status:500
        })
    }
}

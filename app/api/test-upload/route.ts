import { requiredAuth } from "@/lib/auth-service";
import { uploadToDrive } from "@/lib/google-drive";
import { NextResponse } from "next/server";

export async function POST(request:Request){
    try{
        await requiredAuth();
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if(!file){
            return NextResponse.json({error:"No file Uploaded"},{status:400});
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File must be 10 MB or smaller" }, { status: 400 });
        }

        
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf",
        ];

        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".pdf",
        ];
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
        const isValidType =
    allowedTypes.includes(file.type) ||
    allowedExtensions.includes(extension);
        if (!isValidType) {
            return NextResponse.json(
                {
                    error: "Only JPG, PNG and PDF files are allowed",
                },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadFile = await uploadToDrive({
            fileName:file.name,
            mimeType:file.type,
            buffer:buffer,
            folderType:"expenses"
        });
        return NextResponse.json({
            message:"File Uploaded successfully",
            file:uploadFile,
        });
    }
    catch(error){
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(error);
        return NextResponse.json(
            {
                error:"Failed to Upload File",
            },
            {status:500}
        );
    }
}

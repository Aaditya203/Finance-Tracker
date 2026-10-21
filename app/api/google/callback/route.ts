import { oauth2Client } from "@/lib/google-drive";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest){
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if(!code){
        return new NextResponse("Code not found",{status:400});
    }

    try{
        const {tokens} = await oauth2Client.getToken(code);
        console.log("=== NEW GOOGLE REFRESH TOKEN ===");
        console.log(tokens.refresh_token);
        console.log("===============================");
        return NextResponse.json({
            message:"Google Drive Connected Successfully",
            refreshToken: tokens.refresh_token,
            instructions: "Copy the refreshToken above and update GOOGLE_DRIVE_REFRESH_TOKEN in your .env file, then restart the server."
        })

        
    }
    catch(error){
        console.log(error)
        return NextResponse.json({
            message:"Failed to connect to Google Drive",
            error:error
        },{status:500});
    }
}
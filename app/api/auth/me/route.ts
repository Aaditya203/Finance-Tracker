import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { Stats } from "fs";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const { userId } = await requiredAuth();
        const user = await prisma.user.findUnique({
            where:{id:userId},
            select:{id:true,name:true,email:true}
        });

        if(!user){
            return NextResponse.json({
                error:"User Not Found"
            },{status:404});
        }

        return NextResponse.json(user);

    }catch(error){
        if(error instanceof Error && error.message === "UNAUTHORIZED"){
            return NextResponse.json({error:"Unauthorized"},{status:401});
        }
        return NextResponse.json({error:"Internal Server Error"}, {status:500});
    }
}
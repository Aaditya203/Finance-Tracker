import { AuthPayload } from "@/types";
import { cookies } from "next/headers";
import { verifyJWT } from "./auth";

export async function requiredAuth():Promise<AuthPayload>{
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if(!token){
        throw new Error("UNAUTHORIZED");
    }

    const payload = await verifyJWT(token);
    if(!payload){
        throw new Error("UNAUTHORIZED")
    }
    
    return payload;

}
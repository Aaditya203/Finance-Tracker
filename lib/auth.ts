import { AuthPayload } from "@/types";
import {SignJWT,jwtVerify} from "jose";
const secret_key = process.env.JWT_SECRET;

if(!secret_key){
    throw new Error("JWT secret key is not defined");
}



const key = new TextEncoder().encode(secret_key)

export async function createJWT(payload:AuthPayload){
    return new SignJWT(payload)
    .setProtectedHeader({alg:"HS256"})
    .setExpirationTime("24h")
    .setIssuedAt(new Date())
    .setSubject(payload.userId)
    .sign(key)
}

export async function verifyJWT(token:string):Promise<AuthPayload | null>{
    try{
    const {payload} = await jwtVerify(token,key);
    if(typeof payload.userId !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string"){
        return null;
    }

    return {
        userId:payload.userId,
        email:payload.email,
        name:payload.name
    }
    }
    catch{
        return null;
    }
}

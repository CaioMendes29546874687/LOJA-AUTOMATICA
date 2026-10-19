import { NextRequest,NextResponse } from "next/server";
import { ADMIN_COOKIE,ADMIN_SESSION_SECONDS,createAdminSession,verifyAdminPassword } from "@/lib/admin-auth";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 if(!process.env.ADMIN_PASSWORD||!process.env.ADMIN_SESSION_SECRET)return NextResponse.json({error:"Acesso administrativo ainda não foi configurado no servidor."},{status:503});
 let password="";try{const body=await request.json();password=typeof body.password==="string"?body.password:"";}catch{return NextResponse.json({error:"Requisição inválida."},{status:400});}
 if(!verifyAdminPassword(password))return NextResponse.json({error:"Senha incorreta."},{status:401});
 const response=NextResponse.json({ok:true});response.cookies.set(ADMIN_COOKIE,createAdminSession(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:ADMIN_SESSION_SECONDS});response.headers.set("Cache-Control","no-store");return response;
}
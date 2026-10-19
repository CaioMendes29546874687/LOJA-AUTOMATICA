import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ok:true,app:"loja-automatica",mode:process.env.APP_MODE||"demo",databaseConfigured:Boolean(process.env.DATABASE_URL),commerceEnabled:false}); }

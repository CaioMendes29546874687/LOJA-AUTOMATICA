import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){const pool=getPool();let databaseConnected=false;if(pool){try{await pool.query("SELECT 1");databaseConnected=true;}catch{}}
return NextResponse.json({ok:true,app:"loja-automatica",mode:process.env.APP_MODE||"prelaunch",databaseConfigured:Boolean(process.env.DATABASE_URL),databaseConnected,adminConfigured:Boolean(process.env.ADMIN_PASSWORD&&process.env.ADMIN_SESSION_SECRET),paymentsConfigured:Boolean(process.env.PAYMENT_PROVIDER&&process.env.PAYMENT_SECRET),commerceEnabled:false},{headers:{"Cache-Control":"no-store"}});}
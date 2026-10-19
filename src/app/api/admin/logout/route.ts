import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set(ADMIN_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});r.headers.set("Cache-Control","no-store");return r;}
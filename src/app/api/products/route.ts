import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){
 const pool=getPool();if(!pool)return NextResponse.json({items:[],source:"unconfigured",count:0,commerceEnabled:false},{headers:{"Cache-Control":"no-store"}});
 try{const r=await pool.query(`SELECT p.id,p.slug,p.name,c.name AS category,p.description,p.price_cents AS "priceCents",p.status,p.created_at AS "createdAt" FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='active' ORDER BY p.created_at DESC LIMIT 100`);return NextResponse.json({items:r.rows,source:"database",count:r.rowCount,commerceEnabled:false},{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"Não foi possível carregar o catálogo.",commerceEnabled:false},{status:503});}
}
import { NextResponse } from "next/server";
import { demoProducts } from "@/lib/demo-products";
import { getPool } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
 const pool=getPool();
 if(!pool) return NextResponse.json({items:demoProducts,source:"demo",count:demoProducts.length});
 try {
  const result=await pool.query(`SELECT p.id,p.slug,p.name,c.name AS category,p.description,p.price_cents AS "priceCents",p.status,p.created_at AS "createdAt" FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.status='active' ORDER BY p.created_at DESC LIMIT 100`);
  return NextResponse.json({items:result.rows,source:"database",count:result.rowCount});
 } catch { return NextResponse.json({error:"Não foi possível carregar o catálogo."},{status:503}); }
}

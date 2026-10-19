import { NextRequest,NextResponse } from "next/server";
import { ADMIN_COOKIE,isValidAdminSession } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";
export const dynamic="force-dynamic";export const runtime="nodejs";
const unauthorized=()=>NextResponse.json({error:"Sessão administrativa necessária."},{status:401,headers:{"Cache-Control":"no-store"}});
export async function GET(request:NextRequest){
 if(!isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value))return unauthorized();
 const pool=getPool();if(!pool)return NextResponse.json({error:"Banco de dados ainda não configurado."},{status:503});
 try{const [candidates,suppliers]=await Promise.all([
 pool.query(`SELECT slug,product_name AS "productName",category,reference_price_cents AS "referencePriceCents",reference_merchant AS "referenceMerchant",reference_note AS "referenceNote",national_supplier AS "nationalSupplier",international_supplier AS "internationalSupplier",risk_level AS "riskLevel",status,supplier_cost_cents AS "supplierCostCents",shipping_cents AS "shippingCents",target_margin_pct::float AS "targetMarginPct",notes,supplier_authorized AS "supplierAuthorized",invoice_confirmed AS "invoiceConfirmed",stock_confirmed AS "stockConfirmed",shipping_confirmed AS "shippingConfirmed",returns_confirmed AS "returnsConfirmed",tracking_confirmed AS "trackingConfirmed" FROM supplier_candidates WHERE slug = ANY($1::text[]) ORDER BY array_position($1::text[],slug)`,[["kit-colmeia-gavetas","kit-caixas-dobraveis","kit-sacos-vacuo","sapateira-compacta","porta-ovos-geladeira","prateleira-ventosa","separador-talheres","organizador-geladeira-42l","caixa-empilhavel-14l","organizador-modular-gaveta"]]),
 pool.query(`SELECT name,region,website,product_categories AS "productCategories",published_terms AS "publishedTerms",costs_confirmed AS "costsConfirmed",status FROM supplier_options WHERE name = ANY($1::text[]) ORDER BY array_position($1::text[],name)`,[["MP DROP","Dropnacional via Dropi","CJdropshipping","AliExpress — fornecedor individual"]])]);
 return NextResponse.json({candidates:candidates.rows,suppliers:suppliers.rows,commerceEnabled:false},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Não foi possível carregar a pesquisa."},{status:503});}
}
export async function PATCH(request:NextRequest){
 if(!isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value))return unauthorized();
 const pool=getPool();if(!pool)return NextResponse.json({error:"Banco de dados ainda não configurado."},{status:503});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Dados inválidos."},{status:400});}
 const slug=typeof body.slug==="string"?body.slug:"";if(!slug)return NextResponse.json({error:"Produto não informado."},{status:400});
 const validStatuses=["candidate","quoted","approved","rejected"];
 const status=typeof body.status==="string"&&validStatuses.includes(body.status)?body.status:"candidate";
 const parseCents=(v:unknown):number|null|undefined=>{if(v===null||v==="")return null;if(typeof v!=="number"||!Number.isInteger(v)||v<0||v>100000000)return undefined;return v;};
 const supplierCost=parseCents(body.supplierCostCents),shipping=parseCents(body.shippingCents);
 const target=typeof body.targetMarginPct==="number"?body.targetMarginPct:20;
 if(supplierCost===undefined||shipping===undefined||!Number.isFinite(target)||target<0||target>60)return NextResponse.json({error:"Confira os valores de custo, frete e margem."},{status:400});
 const boolFields=["supplierAuthorized","invoiceConfirmed","stockConfirmed","shippingConfirmed","returnsConfirmed","trackingConfirmed"] as const;
 for(const f of boolFields)if(body[f]!==undefined&&typeof body[f]!=="boolean")return NextResponse.json({error:"Checklist inválido."},{status:400});
 const notes=typeof body.notes==="string"?body.notes.slice(0,1500):"";
 try{
 const current=await pool.query("SELECT reference_price_cents FROM supplier_candidates WHERE slug=$1",[slug]);
 if(!current.rowCount)return NextResponse.json({error:"Produto não encontrado."},{status:404});
 if(status==="approved"){
  if(supplierCost===null||shipping===null||!boolFields.every(f=>body[f]===true))return NextResponse.json({error:"Para aprovar, informe custo e frete e confirme os seis itens do checklist."},{status:400});
  const price=Number(current.rows[0].reference_price_cents);const margin=(price-supplierCost-shipping-price*.16)/price*100;
  if(margin<target)return NextResponse.json({error:"A margem estimada não alcança a meta. Revise custo, frete, preço e meta antes de aprovar."},{status:400});
 }
 const result=await pool.query(`UPDATE supplier_candidates SET status=$2,supplier_cost_cents=$3,shipping_cents=$4,target_margin_pct=$5,notes=$6,supplier_authorized=$7,invoice_confirmed=$8,stock_confirmed=$9,shipping_confirmed=$10,returns_confirmed=$11,tracking_confirmed=$12,updated_at=now() WHERE slug=$1 RETURNING slug,status`,[slug,status,supplierCost,shipping,target,notes,...boolFields.map(field=>body[field]===true)]);
 await pool.query("INSERT INTO audit_log(actor,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5::jsonb)",["admin","supplier_candidate_updated","supplier_candidate",slug,JSON.stringify({status})]);
 return NextResponse.json({ok:true,candidate:result.rows[0]},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Falha ao salvar. Verifique a conexão do banco."},{status:503});}
}
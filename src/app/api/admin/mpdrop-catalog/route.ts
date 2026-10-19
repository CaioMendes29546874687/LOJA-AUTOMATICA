import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const unauthorized = () => NextResponse.json({ error: "Sessão administrativa necessária." }, { status: 401, headers: { "Cache-Control": "no-store" } });

type CatalogRow = {
  supplierSku: string;
  productName: string;
  category?: string;
  supplierCostCents: number;
  stockQuantity?: number | null;
  suggestedPriceCents?: number | null;
  weightGrams?: number | null;
  sourceData?: Record<string, unknown>;
};
const validOptionalInteger = (value: unknown) => value === null || value === undefined || (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1000000000);

export async function GET(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) return unauthorized();
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "Banco de dados ainda não configurado." }, { status: 503 });
  try {
    const result = await pool.query(
      `SELECT supplier_sku AS "supplierSku", product_name AS "productName", category,
       supplier_cost_cents AS "supplierCostCents", stock_quantity AS "stockQuantity",
       suggested_price_cents AS "suggestedPriceCents", weight_grams AS "weightGrams",
       imported_at AS "importedAt"
       FROM supplier_catalog_imports WHERE supplier_name='MP DROP'
       ORDER BY imported_at DESC LIMIT 300`
    );
    return NextResponse.json({ items: result.rows, count: result.rowCount ?? 0, published: 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar o catálogo importado." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) return unauthorized();
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "Banco de dados ainda não configurado." }, { status: 503 });
  let body: { rows?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Envie uma lista válida de produtos." }, { status: 400 }); }
  if (!Array.isArray(body.rows) || body.rows.length < 1 || body.rows.length > 500) {
    return NextResponse.json({ error: "Importe entre 1 e 500 linhas por vez." }, { status: 400 });
  }
  const rows: CatalogRow[] = [];
  for (const raw of body.rows) {
    if (!raw || typeof raw !== "object") return NextResponse.json({ error: "Há uma linha inválida no arquivo." }, { status: 400 });
    const row = raw as Record<string, unknown>;
    const supplierSku = typeof row.supplierSku === "string" ? row.supplierSku.trim().slice(0, 120) : "";
    const productName = typeof row.productName === "string" ? row.productName.trim().slice(0, 240) : "";
    const category = typeof row.category === "string" ? row.category.trim().slice(0, 120) : "";
    const supplierCostCents = row.supplierCostCents;
    if (!supplierSku || !productName || typeof supplierCostCents !== "number" || !Number.isInteger(supplierCostCents) || supplierCostCents < 0 || supplierCostCents > 100000000) {
      return NextResponse.json({ error: "Cada produto precisa ter SKU/código, nome e custo válido em centavos." }, { status: 400 });
    }
    const stockQuantity = row.stockQuantity === "" ? null : row.stockQuantity;
    const suggestedPriceCents = row.suggestedPriceCents === "" ? null : row.suggestedPriceCents;
    const weightGrams = row.weightGrams === "" ? null : row.weightGrams;
    if (!validOptionalInteger(stockQuantity) || !validOptionalInteger(suggestedPriceCents) || !validOptionalInteger(weightGrams)) {
      return NextResponse.json({ error: "Estoque, preço sugerido e peso devem ser números inteiros positivos ou vazios." }, { status: 400 });
    }
    const sourceData = row.sourceData && typeof row.sourceData === "object" && !Array.isArray(row.sourceData) ? row.sourceData as Record<string, unknown> : {};
    rows.push({
      supplierSku, productName, category, supplierCostCents,
      stockQuantity: stockQuantity as number | null | undefined,
      suggestedPriceCents: suggestedPriceCents as number | null | undefined,
      weightGrams: weightGrams as number | null | undefined,
      sourceData
    });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      await client.query(
        `INSERT INTO supplier_catalog_imports
         (supplier_name, supplier_sku, product_name, category, supplier_cost_cents, stock_quantity, suggested_price_cents, weight_grams, source_data, imported_at)
         VALUES ('MP DROP',$1,$2,$3,$4,$5,$6,$7,$8::jsonb,now())
         ON CONFLICT (supplier_name, supplier_sku) DO UPDATE SET
          product_name=EXCLUDED.product_name, category=EXCLUDED.category,
          supplier_cost_cents=EXCLUDED.supplier_cost_cents, stock_quantity=EXCLUDED.stock_quantity,
          suggested_price_cents=EXCLUDED.suggested_price_cents, weight_grams=EXCLUDED.weight_grams,
          source_data=EXCLUDED.source_data, imported_at=now()`,
        [row.supplierSku, row.productName, row.category ?? "", row.supplierCostCents, row.stockQuantity ?? null,
         row.suggestedPriceCents ?? null, row.weightGrams ?? null, JSON.stringify(row.sourceData ?? {})]
      );
    }
    await client.query(
      "INSERT INTO audit_log(actor,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5::jsonb)",
      ["admin", "supplier_catalog_imported", "supplier", "MP DROP", JSON.stringify({ rows: rows.length, published: false })]
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, imported: rows.length, published: 0, message: "Catálogo salvo como rascunho interno; nenhum produto foi publicado." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Falha ao salvar o catálogo. Nenhum produto foi publicado." }, { status: 503 });
  } finally {
    client.release();
  }
}

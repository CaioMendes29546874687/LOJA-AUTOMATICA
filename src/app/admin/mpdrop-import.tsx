"use client";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

type ImportedItem = { supplierSku: string; productName: string; category: string; supplierCostCents: number; stockQuantity: number | null; suggestedPriceCents: number | null; weightGrams: number | null; importedAt?: string };
type ParsedRow = Omit<ImportedItem, "importedAt"> & { sourceData: Record<string, string> };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function splitCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  return rows;
}
function parseMoney(value: string): number | null {
  let s = value.replace(/R\$|\s/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  s = s.replace(/[^0-9.-]/g, "");
  const number = Number(s);
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) : null;
}
function parseOptionalInteger(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}
function parseRows(text: string): { rows: ParsedRow[]; errors: string[] } {
  const raw = splitCsv(text);
  if (raw.length < 2) return { rows: [], errors: ["Cole um CSV com cabeçalho e pelo menos uma linha de produto."] };
  const headers = raw[0].map(normalize);
  const find = (aliases: string[]) => headers.findIndex(h => aliases.includes(h));
  const skuIndex = find(["sku", "codigo", "codigoproduto", "referencia", "ref", "cod"]);
  const nameIndex = find(["produto", "nome", "nomeproduto", "descricao", "descricaoproduto", "productname", "title"]);
  const costIndex = find(["custo", "precocusto", "custounitario", "valorcusto", "cost", "suppliercost", "costprice", "precocompra"]);
  const categoryIndex = find(["categoria", "category", "grupoproduto", "grupo"]);
  const stockIndex = find(["estoque", "quantidade", "saldo", "stock", "stockquantity", "qtd"]);
  const suggestedIndex = find(["precosugerido", "precovenda", "precorecomendado", "suggestedprice", "retailprice"]);
  const weightIndex = find(["peso", "pesog", "pesogramas", "weight", "weightgrams"]);
  const errors: string[] = [];
  if (skuIndex < 0) errors.push("Não encontrei a coluna SKU/código. Inclua uma coluna SKU ou Código.");
  if (nameIndex < 0) errors.push("Não encontrei a coluna Nome/Produto.");
  if (costIndex < 0) errors.push("Não encontrei a coluna Custo/Preço de custo.");
  if (errors.length) return { rows: [], errors };
  const rows: ParsedRow[] = [];
  raw.slice(1).forEach((cells, index) => {
    const value = (i: number) => i >= 0 ? (cells[i] ?? "").trim() : "";
    const supplierSku = value(skuIndex);
    const productName = value(nameIndex);
    const supplierCostCents = parseMoney(value(costIndex));
    if (!supplierSku || !productName || supplierCostCents === null) {
      errors.push("Linha " + (index + 2) + ": SKU, nome e custo válido são obrigatórios.");
      return;
    }
    const stockText = value(stockIndex), suggestedText = value(suggestedIndex), weightText = value(weightIndex);
    rows.push({
      supplierSku, productName, category: value(categoryIndex), supplierCostCents,
      stockQuantity: stockText ? parseOptionalInteger(stockText) : null,
      suggestedPriceCents: suggestedText ? parseMoney(suggestedText) : null,
      weightGrams: weightText ? parseOptionalInteger(weightText) : null,
      sourceData: Object.fromEntries(headers.map((header, i) => [header || "coluna_" + (i + 1), cells[i] ?? ""]))
    });
  });
  if (rows.length > 500) errors.push("O limite é 500 produtos por importação.");
  return { rows: rows.slice(0, 500), errors };
}
const money = (cents: number | null) => cents == null ? "—" : (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MpDropImport() {
  const [csv, setCsv] = useState("");
  const [items, setItems] = useState<ImportedItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const parsed = parseRows(csv);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/mpdrop-catalog", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setItems(data.items ?? []);
      else setErrors([data.error ?? "Não foi possível carregar o catálogo."]);
    } catch { setErrors(["Falha de conexão ao consultar o catálogo."]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void file.text().then(setCsv).catch(() => setErrors(["Não foi possível ler esse arquivo. Tente salvar como CSV UTF-8."]));
    setNotice("");
  }
  async function importCatalog() {
    setBusy(true); setErrors([]); setNotice("");
    try {
      const response = await fetch("/api/admin/mpdrop-catalog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed.rows })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao importar.");
      setNotice(data.message ?? ("Importados: " + data.imported));
      await load();
    } catch (error) { setErrors([error instanceof Error ? error.message : "Falha ao importar o catálogo."]); }
    finally { setBusy(false); }
  }
  return <section className="panel mpdrop-panel" id="mpdrop-import">
    <div className="panel-heading"><div><p className="eyebrow">FORNECEDOR NACIONAL</p><h2>Conectar catálogo MP DROP</h2><p>Importação protegida para conferência de custo, estoque e preço. Não publica produtos nem aceita pedidos.</p></div><span className="pill">RASCUNHO</span></div>
    <div className="mpdrop-content">
      <div className="mpdrop-steps"><b>1</b><span>Entre na MP DROP e procure no catálogo uma opção de exportar/baixar produtos. Se houver integração com Bling, também podemos usar o arquivo de catálogo exportado pelo ERP.</span><b>2</b><span>Selecione abaixo um CSV UTF-8 ou cole o conteúdo do CSV na caixa. A plataforma não disponibiliza API pública direta documentada, então não vamos simular uma conexão automática.</span><b>3</b><span>Confira a prévia e importe. O SKU será usado para atualizar o mesmo item nas próximas importações.</span></div>
      <label className="mpdrop-file">Selecionar arquivo CSV<input type="file" accept=".csv,text/csv,.txt" onChange={readFile}/></label>
      <label className="mpdrop-label">Ou cole o conteúdo do CSV<textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={6} placeholder={"SKU;Produto;Categoria;Custo;Estoque;Preço sugerido;Peso\nMP-001;Organizador de gaveta;Casa;12,90;25;29,90;300"}/></label>
      <p className="mpdrop-hint">Colunas obrigatórias: SKU/Código, Nome/Produto e Custo/Preço de custo. Aceita CSV separado por vírgula ou ponto e vírgula. Valores monetários em formato brasileiro, como 12,90.</p>
      {errors.length > 0 && <div className="mpdrop-errors" role="alert">{errors.map((error,i)=><p key={i}>{error}</p>)}</div>}
      {notice && <p className="mpdrop-success" role="status">{notice}</p>}
      <div className="mpdrop-preview-head"><h3>Prévia da importação</h3><span>{parsed.rows.length} linha(s) válidas</span></div>
      {parsed.rows.length > 0 && <div className="mpdrop-table-wrap"><table className="mpdrop-table"><thead><tr><th>SKU</th><th>Produto</th><th>Custo MP DROP</th><th>Estoque</th><th>Preço sugerido</th></tr></thead><tbody>{parsed.rows.slice(0,5).map((item,i)=><tr key={item.supplierSku + i}><td>{item.supplierSku}</td><td>{item.productName}</td><td>{money(item.supplierCostCents)}</td><td>{item.stockQuantity ?? "—"}</td><td>{money(item.suggestedPriceCents)}</td></tr>)}</tbody></table>{parsed.rows.length>5&&<p className="mpdrop-hint">Mostrando 5 de {parsed.rows.length} itens.</p>}</div>}
      <button className="mpdrop-import-btn" type="button" disabled={busy || parsed.rows.length===0 || parsed.errors.length>0} onClick={()=>void importCatalog()}>{busy?"Importando…":"Importar para catálogo interno"}</button>
      <div className="mpdrop-existing"><div className="mpdrop-preview-head"><h3>Itens importados</h3><span>{loading?"Carregando…":items.length+" itens recentes"}</span></div>{items.length===0&&!loading?<p className="mpdrop-hint">Nenhum item importado ainda.</p>:<div className="mpdrop-table-wrap"><table className="mpdrop-table"><thead><tr><th>SKU</th><th>Produto</th><th>Custo</th><th>Estoque</th></tr></thead><tbody>{items.slice(0,10).map(item=><tr key={item.supplierSku}><td>{item.supplierSku}</td><td>{item.productName}</td><td>{money(item.supplierCostCents)}</td><td>{item.stockQuantity ?? "—"}</td></tr>)}</tbody></table></div>}</div>
      <p className="mpdrop-hint">Importação salva somente o catálogo do fornecedor para análise. Produtos continuam fora da vitrine; custo, frete ao CEP, autorização de envio direto, nota fiscal e devoluções precisam ser confirmados antes de qualquer aprovação.</p>
    </div>
  </section>;
}

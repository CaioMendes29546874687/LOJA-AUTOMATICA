"use client";
import { useMemo, useState } from "react";

const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function parseAmount(value: string): number {
  const normalized = value.split(".").join("").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function Tools() {
  const [sale, setSale] = useState("99,90");
  const [cost, setCost] = useState("45,00");
  const [shipping, setShipping] = useState("0,00");
  const [fees, setFees] = useState("5");
  const [tax, setTax] = useState("6");
  const [reserve, setReserve] = useState("5,00");

  const result = useMemo(() => {
    const price = parseAmount(sale);
    const productCost = parseAmount(cost);
    const delivery = parseAmount(shipping);
    const unexpected = parseAmount(reserve);
    const paymentRate = Math.max(0, parseAmount(fees)) / 100;
    const taxRate = Math.max(0, parseAmount(tax)) / 100;
    const net = price - productCost - delivery - unexpected - price * paymentRate - price * taxRate;
    const divisor = 1 - paymentRate - taxRate;
    return {
      net,
      margin: price > 0 ? (net / price) * 100 : 0,
      breakEven: divisor > 0 ? (productCost + delivery + unexpected) / divisor : 0,
    };
  }, [sale, cost, shipping, fees, tax, reserve]);

  return (
    <div className="panel calculator">
      <div className="panel-heading">
        <div>
          <h2>Calculadora de margem</h2>
          <p>Estimativa manual — não substitui orientação fiscal ou contábil.</p>
        </div>
        <span className="pill">SIMULAÇÃO</span>
      </div>
      <div className="calc-grid">
        <label>Preço de venda (R$)<input inputMode="decimal" value={sale} onChange={(e) => setSale(e.target.value)} /></label>
        <label>Custo do produto (R$)<input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} /></label>
        <label>Frete pago pela loja (R$)<input inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} /></label>
        <label>Taxa de pagamento (%)<input inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} /></label>
        <label>Tributos estimados (%)<input inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} /></label>
        <label>Reserva para imprevistos (R$)<input inputMode="decimal" value={reserve} onChange={(e) => setReserve(e.target.value)} /></label>
      </div>
      <div className="calc-results">
        <div><span>Lucro estimado por venda</span><strong className={result.net < 0 ? "negative" : ""}>{money(result.net)}</strong></div>
        <div><span>Margem estimada</span><strong className={result.margin < 0 ? "negative" : ""}>{result.margin.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong></div>
        <div><span>Preço mínimo estimado</span><strong>{money(result.breakEven)}</strong></div>
      </div>
      <p className="calc-warning">Inclua todos os custos reais antes de decidir. A taxa tributária é apenas uma hipótese editável; confirme o enquadramento com um contador. Valores não são salvos nem enviados ao servidor.</p>
    </div>
  );
}

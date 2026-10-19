import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "./admin.css";
import Tools from "./tools";
import ResearchPanel from "./research-panel";
import LogoutButton from "./logout-button";
import { ADMIN_COOKIE,isValidAdminSession } from "@/lib/admin-auth";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 const cookieStore=await cookies();
 if(!isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value))redirect("/admin/login");
 return <main className="admin-shell"><aside className="sidebar"><a className="brand" href="/"><span className="brand-mark">L</span><span>LOJA AUTO</span></a><p className="side-label">OPERAÇÃO</p><a className="side-link selected" href="/admin">▦ Preparação</a><a className="side-link" href="/#seguranca">▣ Status da loja</a><span className="side-link muted">▤ Pedidos — bloqueados</span><span className="side-link muted">♧ Fornecedores — validação</span><span className="side-link muted">◷ Financeiro — calculadora</span><div className="side-bottom">● Pré-lançamento seguro</div></aside>
 <section className="admin-main"><header className="admin-header"><div><p className="eyebrow">CENTRAL DE CONTROLE</p><h1>Preparar para vender</h1></div><div className="admin-actions"><a className="outline-btn" href="/">↖ Ver loja</a><LogoutButton/></div></header>
 <div className="notice"><b>Vendas desativadas</b><span>Checkout e pagamentos não existem nesta versão. Produtos candidatos são internos e não aparecem na vitrine. A aprovação nesta tela não publica ofertas.</span></div>
 <div className="stat-grid"><div className="stat-card"><span>Produtos publicados</span><strong>0</strong><small>Vitrine sem catálogo comercial</small></div><div className="stat-card"><span>Fornecedores validados</span><strong>0</strong><small>Condições por SKU pendentes</small></div><div className="stat-card"><span>Pedidos aceitos</span><strong>0</strong><small>Checkout bloqueado</small></div><div className="stat-card"><span>Orçamento inicial</span><strong>R$ 0</strong><small>Priorizar teste gratuito</small></div></div>
 <ResearchPanel/><Tools/><div className="panel next-panel"><div><p className="eyebrow">PRÓXIMAS ETAPAS</p><h2>Portas para ativar vendas</h2><p>Não habilitar checkout até que todos os itens abaixo sejam testados em ambiente controlado.</p></div><ol><li>Autenticação administrativa e sessão segura — testar login/logout e proteção de sessão</li><li>Banco persistente e tabelas — configurados; verificar conectividade</li><li>Fornecedores e custos por SKU — validar documentação e cotações</li><li>Gateway de pagamento em sandbox, webhooks e idempotência — pendente</li><li>Políticas, formalização, fiscal, privacidade e atendimento — pendentes</li><li>Testes ponta a ponta e aprovação manual antes de qualquer venda</li></ol></div><footer>LOJA AUTOMÁTICA / PRÉ-LANÇAMENTO · v0.3.0 · CHECKOUT DESATIVADO</footer></section></main>;
}
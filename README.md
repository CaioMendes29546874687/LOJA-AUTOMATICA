# Loja Automática

Projeto Next.js da Loja Automática. A versão publicada está em PRÉ-LANÇAMENTO: vitrine sem produtos fictícios e sem checkout, para evitar receber pedidos sem fornecedor, estoque, prazo e política comercial confirmados.

## Ambiente
- Node.js / Next.js
- Render para hospedagem (plano atual gratuito, sujeito a limites e suspensão por inatividade)
- PostgreSQL previsto; ainda não conectado
- APP_MODE=demo; pagamentos e pedidos reais desativados

## Antes de vender
1. Definir nicho e público.
2. Validar fornecedor que autorize envio direto, nota fiscal/origem, estoque, prazo, rastreamento e devoluções.
3. Calcular preço incluindo custo, frete, taxa de pagamento, tributos e reserva para devoluções/defeitos.
4. Verificar formalização, emissão fiscal, CDC, LGPD, termos, privacidade, troca/devolução e dados de contato.
5. Configurar banco persistente, autenticação segura e auditoria no painel.
6. Integrar gateway em sandbox e validar webhooks no servidor, idempotência e reconciliação.
7. Fazer piloto com poucos produtos antes de ampliar o catálogo.

## Segurança atual
- Não há checkout nem pedidos reais.
- A página /admin é apenas um painel de preparação e não deve ser tratada como área privada: autenticação real ainda precisa ser implementada antes de inserir dados confidenciais.
- A calculadora é local ao navegador e não salva os valores.
- Não inserir credenciais, tokens ou dados pessoais no repositório.
- Não publicar produtos sem autorização de envio direto e prazo/condições documentados.

## Execução local
Instale as dependências com npm install e execute npm run dev.

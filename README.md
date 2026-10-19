# Loja Automática

Next.js em pré-lançamento para dropshipping de casa e organização.

## Status de segurança
- Checkout e pagamentos permanecem desativados.
- A vitrine não publica os 10 candidatos de pesquisa.
- /admin exige senha administrativa configurada no servidor.
- Sessão usa cookie HTTP-only, SameSite=Strict, assinatura HMAC e expira em 8 horas.
- A API de pesquisa exige sessão válida e registra alterações na auditoria.
- A aprovação interna exige custo e frete informados, seis verificações do fornecedor e margem estimada mínima.
- Preços pesquisados são referências varejistas observadas, não cotações de fornecedores nem preços de venda prometidos.
- Nunca armazene credenciais em Git. Configure DATABASE_URL, ADMIN_PASSWORD e ADMIN_SESSION_SECRET no Render.
- Não habilite checkout até testar gateway em sandbox, webhooks assinados, idempotência, reembolsos e conciliação.

## Ambiente
- Node.js / Next.js
- Render para hospedagem
- PostgreSQL no Neon para dados persistentes
- APP_MODE=prelaunch
- COMMERCE_ENABLED=false, PAYMENTS_ENABLED=false

## Fornecedores a validar
- Dropi / Dropnacional: https://www.dropi.com.br/dropnacional
- AliExpress: https://www.aliexpress.com/
- CJdropshipping: https://cjdropshipping.com/

## Execução local
Instale dependências com npm install e execute npm run dev.

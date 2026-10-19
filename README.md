# Loja Automática

Loja online em Next.js com catálogo demonstrativo e painel administrativo inicial.

## Estado atual
- Interface pública responsiva e painel de demonstração.
- Endpoints de saúde e catálogo.
- Esquema PostgreSQL inicial.
- Pagamentos, pedidos reais, autenticação administrativa e envio a fornecedores **desativados** até configuração e testes.
- Produtos e preços atuais são fictícios.

## Rodar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000. Para compilar: `npm run build`.

## Configuração
Copie `.env.example` para `.env.local` se for conectar banco. Nunca envie segredos ao Git.

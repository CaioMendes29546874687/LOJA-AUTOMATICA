-- Create private draft product records from the internal shortlist.
-- Price is a retailer reference only; do not activate until supplier quote, freight and all costs are verified.
INSERT INTO categories(name,slug) VALUES
('Quarto e closet','quarto-e-closet'),
('Quarto e armazenamento','quarto-e-armazenamento'),
('Cozinha','cozinha'),
('Banheiro e cozinha','banheiro-e-cozinha')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO products(category_id,slug,name,description,price_cents,supplier_cost_cents,supplier_sku,image_url,status)
SELECT c.id,s.slug,s.product_name,
       'RASCUNHO — não publicado. Preço atual é referência varejista, não preço de venda definido. Custo do fornecedor, frete, estoque, prazo, taxas, impostos e devoluções ainda precisam ser confirmados. ' || s.reference_note,
       s.reference_price_cents,NULL,NULL,NULL,'draft'
FROM supplier_candidates s
JOIN categories c ON c.name=s.category
WHERE s.slug IN ('kit-colmeia-gavetas','kit-caixas-dobraveis','kit-sacos-vacuo','sapateira-compacta','porta-ovos-geladeira','prateleira-ventosa','separador-talheres','organizador-geladeira-42l','caixa-empilhavel-14l','organizador-modular-gaveta')
ON CONFLICT(slug) DO NOTHING;

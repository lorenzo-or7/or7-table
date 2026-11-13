-- =============================================================================
-- Or7 Table — cardápios demonstrativos
-- Requer as migrações 0001 e 0002 (preços por tamanho) já aplicadas.
--   /table/demo       Casa Maré (restaurante fictício, fotos Unsplash)
--   /table/la-brasa   La Brasa (hamburgueria; fotos e logo enviados pelo cliente,
--                     servidos pelo próprio site em /demo/la-brasa; preços de demonstração)
--   /table/starbucks  Starbucks (demonstração conceitual NÃO OFICIAL; material enviado
--                     pelo usuário em /demo/starbucks; preços de referência por tamanho)
-- Idempotente: pode rodar de novo; recria categorias e produtos das demonstrações
-- sem duplicar nada e sem tocar nos estabelecimentos reais.
-- =============================================================================

-- Casa Maré ----------------------------------------------------------------

insert into public.establishments (id, name, slug, is_active, theme_key, tagline, address, opening_hours, instagram, logo_path)
values ('e0000000-0000-4000-8000-000000000001', 'Casa Maré', 'demo', true, 'casa-mare', 'Cozinha do litoral, na brasa e no tempo certo.', 'Endereço fictício · demonstração', 'Ter a dom · 12h às 23h', '@casamare.demo', null)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, is_active = true, theme_key = excluded.theme_key,
  tagline = excluded.tagline, address = excluded.address, opening_hours = excluded.opening_hours,
  instagram = excluded.instagram, logo_path = excluded.logo_path;

insert into public.establishment_billing (establishment_id, monthly_fee, notes)
values ('e0000000-0000-4000-8000-000000000001', 0, 'Demonstração interna — não é cliente.')
on conflict (establishment_id) do nothing;

delete from public.products where establishment_id = 'e0000000-0000-4000-8000-000000000001';
delete from public.categories where establishment_id = 'e0000000-0000-4000-8000-000000000001';

insert into public.categories (id, establishment_id, name, position) values
  ('c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'Para começar', 0),
  ('c0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'Do mar', 1),
  ('c0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000001', 'Na brasa', 2),
  ('c0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000001', 'Sobremesas', 3),
  ('c0000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000001', 'Para beber', 4);

insert into public.products (id, establishment_id, category_id, name, description, price, variants, image_path, is_available, position) values
  ('b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Ceviche da casa', 'Peixe branco curado no limão, leite de tigre, milho tostado e batata-doce.', 58.00, null, 'https://images.unsplash.com/photo-1761314036709-f6f68a3d7cf1?auto=format&fit=crop&w=900&q=70', true, 0),
  ('b0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Ostras frescas · 6 un.', 'No gelo, com limão-cravo e vinagrete de pimenta-de-cheiro.', 72.00, null, 'https://images.unsplash.com/photo-1729269524124-1645db0b0ff5?auto=format&fit=crop&w=900&q=70', true, 1),
  ('b0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Lula crocante', 'Anéis empanados na farinha de milho, maionese de alho negro e limão.', 46.00, null, 'https://images.unsplash.com/photo-1778600731531-7d836a32704c?auto=format&fit=crop&w=900&q=70', true, 2),
  ('b0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Tostada de atum', 'Atum em cubos, manga, pepino e gergelim sobre tortilha crocante.', 49.00, null, 'https://images.unsplash.com/photo-1769830644804-0ede2ee32a62?auto=format&fit=crop&w=900&q=70', true, 3),
  ('b0000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'Linguine do pescador', 'Camarão, vôngole e lula no molho de tomate assado com manjericão.', 92.00, null, 'https://images.unsplash.com/photo-1672636401296-72fefd00e745?auto=format&fit=crop&w=900&q=70', true, 4),
  ('b0000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'Camarão na panela', 'Camarões grandes, tomate, coentro e pirão de leite de coco.', 108.00, null, 'https://images.unsplash.com/photo-1762631882900-e3174bada2ed?auto=format&fit=crop&w=900&q=70', false, 5),
  ('b0000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'Camarão ao alho', 'Salteado no azeite com alho dourado, páprica defumada e pão da casa.', 84.00, null, 'https://images.unsplash.com/photo-1691201659377-978b28daa417?auto=format&fit=crop&w=900&q=70', true, 6),
  ('b0000000-0000-4000-8000-000000000008', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'Polvo na brasa', 'Tentáculos grelhados, batatas ao murro e azeite de ervas.', 126.00, null, 'https://images.unsplash.com/photo-1764397514672-63b1a7a79110?auto=format&fit=crop&w=900&q=70', true, 7),
  ('b0000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'Peixe do dia', 'Filé grelhado com manteiga de limão, legumes da estação e farofa de castanha.', 98.00, null, 'https://images.unsplash.com/photo-1665401015549-712c0dc5ef85?auto=format&fit=crop&w=900&q=70', true, 8),
  ('b0000000-0000-4000-8000-000000000010', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'Travessa da maré · para 2', 'Peixe e polvo na brasa, salada verde, arroz de coentro e vinagrete.', 214.00, null, 'https://images.unsplash.com/photo-1768322264423-4b0adf0cf31b?auto=format&fit=crop&w=900&q=70', true, 9),
  ('b0000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', 'Tiramisù de laranja', 'Mascarpone, café coado e raspas de laranja-baía.', 34.00, null, 'https://images.unsplash.com/photo-1773418264113-4206f83e4aa7?auto=format&fit=crop&w=900&q=70', true, 10),
  ('b0000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', 'Bolo de chocolate e flor de sal', 'Fatia úmida com ganache amarga e creme fresco.', 32.00, null, 'https://images.unsplash.com/photo-1673912402587-57ac40f1b4a5?auto=format&fit=crop&w=900&q=70', true, 11),
  ('b0000000-0000-4000-8000-000000000013', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', 'Sorvete da casa', 'Duas bolas de baunilha com crocante de castanha-de-caju.', 26.00, null, 'https://images.unsplash.com/photo-1700482006355-ad309eff83ed?auto=format&fit=crop&w=900&q=70', true, 12),
  ('b0000000-0000-4000-8000-000000000014', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005', 'Caipirinha de limão-cravo', 'Cachaça envelhecida, limão-cravo e rapadura.', 32.00, null, 'https://images.unsplash.com/photo-1613478223460-f448a4de829d?auto=format&fit=crop&w=900&q=70', true, 13),
  ('b0000000-0000-4000-8000-000000000015', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005', 'Limonada da casa', 'Limão-siciliano, hortelã e água com gás.', 16.00, null, 'https://images.unsplash.com/photo-1512144981474-0003a89c0165?auto=format&fit=crop&w=900&q=70', true, 14),
  ('b0000000-0000-4000-8000-000000000016', 'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005', 'Suco verde', 'Couve, abacaxi, gengibre e hortelã, batido na hora.', 18.00, null, 'https://images.unsplash.com/photo-1662560094368-821ba04f6d0c?auto=format&fit=crop&w=900&q=70', true, 15);

-- La Brasa ----------------------------------------------------------------

insert into public.establishments (id, name, slug, is_active, theme_key, tagline, address, opening_hours, instagram, logo_path)
values ('e0000000-0000-4000-8000-000000000002', 'La Brasa', 'la-brasa', true, 'la-brasa', 'Street burger na brasa.', 'Rua Arion Niepce da Silva, 335, Curitiba, 80610-310', 'Todos os dias · 18h30 às 23h30', null, '/demo/la-brasa/logo.webp')
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, is_active = true, theme_key = excluded.theme_key,
  tagline = excluded.tagline, address = excluded.address, opening_hours = excluded.opening_hours,
  instagram = excluded.instagram, logo_path = excluded.logo_path;

insert into public.establishment_billing (establishment_id, monthly_fee, notes)
values ('e0000000-0000-4000-8000-000000000002', 0, 'Demonstração interna — não é cliente.')
on conflict (establishment_id) do nothing;

delete from public.products where establishment_id = 'e0000000-0000-4000-8000-000000000002';
delete from public.categories where establishment_id = 'e0000000-0000-4000-8000-000000000002';

insert into public.categories (id, establishment_id, name, position) values
  ('c1000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 'Burgers', 0),
  ('c1000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'Smashs', 1),
  ('c1000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002', 'Doces', 2),
  ('c1000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000002', 'Hot dogs', 3),
  ('c1000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000002', 'Porções', 4),
  ('c1000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000002', 'Milkshakes', 5),
  ('c1000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000002', 'Bebidas', 6);

insert into public.products (id, establishment_id, category_id, name, description, price, variants, image_path, is_available, position) values
  ('b1000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Costelão', 'Blend de costela na brasa, cheddar, bacon, ovo, alface, tomate e cebola roxa no pão brioche.', 42.90, null, '/demo/la-brasa/costelao.webp', true, 0),
  ('b1000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Australiano', 'Blend bovino, cheddar derretido, bacon crocante, cebola roxa e folhas no pão australiano.', 38.90, null, '/demo/la-brasa/australiano.webp', true, 1),
  ('b1000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'La Queso', 'Blend bovino, queijo empanado crocante, bacon, alface, tomate e maionese da casa.', 39.90, null, '/demo/la-brasa/la-queso.webp', true, 2),
  ('b1000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'Smash Cheddar', 'Dois smashs prensados na chapa, cheddar, bacon e cebola caramelizada no brioche.', 32.90, null, '/demo/la-brasa/smash-cheddar.webp', true, 3),
  ('b1000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'Smash Catupiry', 'Dois smashs prensados na chapa, Catupiry original e bacon no brioche.', 34.90, null, '/demo/la-brasa/smash-catupiry.webp', true, 4),
  ('b1000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000003', 'Burger Nutella', 'Pão brioche com açúcar, Nutella, morangos frescos e creme batido.', 29.90, null, '/demo/la-brasa/burger-nutella.webp', true, 5),
  ('b1000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000004', 'Caramelo', 'Salsicha na brasa, cheddar cremoso e farofa de bacon no pão macio.', 27.90, null, '/demo/la-brasa/caramelo.webp', true, 6),
  ('b1000000-0000-4000-8000-000000000008', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000004', 'Goudog', 'Salsicha na brasa, queijo gratinado e molho barbecue da casa.', 26.90, null, '/demo/la-brasa/goudog.webp', true, 7),
  ('b1000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000005', 'Batata ondulada', 'Batata ondulada crocante, sequinha por fora e macia por dentro. Serve bem duas pessoas.', 24.90, null, '/demo/la-brasa/batata-ondulada.webp', true, 8),
  ('b1000000-0000-4000-8000-000000000010', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000005', 'Onion rings', 'Anéis de cebola empanados e fritos na hora.', 26.90, null, '/demo/la-brasa/onion-rings.webp', true, 9),
  ('b1000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000006', 'Milkshake de morango', 'Sorvete de baunilha batido com morango, calda de morango e chantilly.', 22.90, null, '/demo/la-brasa/milkshake-morango.webp', true, 10),
  ('b1000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000006', 'Milkshake de Oreo', 'Sorvete batido com Oreo, calda de chocolate, bolinhas crocantes e chantilly.', 24.90, null, '/demo/la-brasa/milkshake-oreo.webp', true, 11),
  ('b1000000-0000-4000-8000-000000000013', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000007', 'Coca-Cola lata', '350 ml, gelada.', 7.00, null, '/demo/la-brasa/coca-cola.webp', true, 12),
  ('b1000000-0000-4000-8000-000000000014', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000007', 'Sprite lata', '350 ml, gelada.', 7.00, null, '/demo/la-brasa/sprite.webp', true, 13),
  ('b1000000-0000-4000-8000-000000000015', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000007', 'Cerveja Sol long neck', '330 ml, gelada.', 12.90, null, '/demo/la-brasa/cerveja-sol.webp', true, 14),
  ('b1000000-0000-4000-8000-000000000016', 'e0000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000007', 'Jarra de suco de laranja', 'Suco natural, feito na hora. Jarra de 1 litro.', 18.90, null, '/demo/la-brasa/jarra-suco.webp', true, 15);

-- Starbucks (demonstração não oficial) ----------------------------------------------------------------

insert into public.establishments (id, name, slug, is_active, theme_key, tagline, address, opening_hours, instagram, logo_path)
values ('e0000000-0000-4000-8000-000000000003', 'Starbucks', 'starbucks', true, 'starbucks', 'Demonstração conceitual não oficial.', null, null, null, null)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, is_active = true, theme_key = excluded.theme_key,
  tagline = excluded.tagline, address = excluded.address, opening_hours = excluded.opening_hours,
  instagram = excluded.instagram, logo_path = excluded.logo_path;

insert into public.establishment_billing (establishment_id, monthly_fee, notes)
values ('e0000000-0000-4000-8000-000000000003', 0, 'Demonstração interna — não é cliente.')
on conflict (establishment_id) do nothing;

delete from public.products where establishment_id = 'e0000000-0000-4000-8000-000000000003';
delete from public.categories where establishment_id = 'e0000000-0000-4000-8000-000000000003';

insert into public.categories (id, establishment_id, name, position) values
  ('c2000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 'Cafés quentes', 0),
  ('c2000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000003', 'Cafés gelados', 1),
  ('c2000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003', 'Frappuccinos', 2),
  ('c2000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000003', 'Comidas', 3);

insert into public.products (id, establishment_id, category_id, name, description, price, variants, image_path, is_available, position) values
  ('b2000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000001', 'Caffè Latte', 'Espresso encorpado com leite vaporizado e uma camada fina de espuma.', 15.90, '[{"label":"Tall","volume_ml":300,"price":15.9},{"label":"Grande","volume_ml":400,"price":17.9},{"label":"Venti","volume_ml":500,"price":19.9}]'::jsonb, '/demo/starbucks/caffe-latte.webp', true, 0),
  ('b2000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000001', 'Cappuccino Tradicional', 'Espresso com partes iguais de leite vaporizado e espuma alta e cremosa.', 17.90, '[{"label":"Tall","volume_ml":300,"price":17.9},{"label":"Grande","volume_ml":400,"price":19.9},{"label":"Venti","volume_ml":500,"price":21.9}]'::jsonb, '/demo/starbucks/cappuccino.webp', true, 1),
  ('b2000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000001', 'Caramelo Macchiato', 'Leite vaporizado com baunilha, espresso por cima e treliça de calda de caramelo.', 18.90, '[{"label":"Tall","volume_ml":300,"price":18.9},{"label":"Grande","volume_ml":400,"price":20.9},{"label":"Venti","volume_ml":500,"price":22.9}]'::jsonb, '/demo/starbucks/caramelo-macchiato.webp', true, 2),
  ('b2000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000002', 'Iced Caffè Latte', 'Espresso servido sobre leite gelado e muito gelo.', 15.90, '[{"label":"Tall","volume_ml":300,"price":15.9},{"label":"Grande","volume_ml":400,"price":17.9},{"label":"Venti","volume_ml":500,"price":19.9}]'::jsonb, '/demo/starbucks/iced-caffe-latte.webp', true, 3),
  ('b2000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000002', 'Cold Brew', 'Café extraído a frio por longas horas: suave, encorpado e com notas de chocolate.', 15.90, '[{"label":"Tall","volume_ml":300,"price":15.9},{"label":"Grande","volume_ml":400,"price":17.9},{"label":"Venti","volume_ml":500,"price":19.9}]'::jsonb, '/demo/starbucks/cold-brew.webp', true, 4),
  ('b2000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000002', 'Iced Caramelo Macchiato', 'Leite gelado com baunilha, espresso e calda de caramelo por cima.', 18.90, '[{"label":"Tall","volume_ml":300,"price":18.9},{"label":"Grande","volume_ml":400,"price":20.9},{"label":"Venti","volume_ml":500,"price":22.9}]'::jsonb, '/demo/starbucks/iced-caramelo-macchiato.webp', true, 5),
  ('b2000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000003', 'Caramelo Frappuccino', 'Café batido com gelo e caramelo, chantilly e calda de caramelo.', 22.90, '[{"label":"Tall","volume_ml":300,"price":22.9},{"label":"Grande","volume_ml":400,"price":24.9},{"label":"Venti","volume_ml":500,"price":26.9}]'::jsonb, '/demo/starbucks/caramelo-frappuccino.webp', true, 6),
  ('b2000000-0000-4000-8000-000000000008', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000003', 'Mocha Frappuccino', 'Café, chocolate e gelo batidos, com chantilly e calda de mocha.', 22.90, '[{"label":"Tall","volume_ml":300,"price":22.9},{"label":"Grande","volume_ml":400,"price":24.9},{"label":"Venti","volume_ml":500,"price":26.9}]'::jsonb, '/demo/starbucks/mocha-frappuccino.webp', true, 7),
  ('b2000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000003', 'Choco Chip Frappuccino', 'Chocolate com gotas de chocolate batidas com gelo, chantilly e calda de mocha.', 22.90, '[{"label":"Tall","volume_ml":300,"price":22.9},{"label":"Grande","volume_ml":400,"price":24.9},{"label":"Venti","volume_ml":500,"price":26.9}]'::jsonb, '/demo/starbucks/choco-chip-frappuccino.webp', true, 8),
  ('b2000000-0000-4000-8000-000000000010', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000004', 'Croissant de Presunto e Queijo', 'Croissant amanteigado, folhado e quentinho, com presunto e queijo derretido.', 12.65, null, '/demo/starbucks/croissant-presunto-queijo.webp', true, 9),
  ('b2000000-0000-4000-8000-000000000011', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000004', 'Pão de Queijo', 'Pão de queijo mineiro, casquinha dourada e miolo macio.', 8.25, null, '/demo/starbucks/pao-de-queijo.webp', true, 10),
  ('b2000000-0000-4000-8000-000000000012', 'e0000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000004', 'Brownie Espresso', 'Brownie de chocolate meio amargo com um toque de espresso.', 12.10, null, '/demo/starbucks/brownie-espresso.webp', true, 11);

-- Destaques do Starbucks Demo (coluna criada na 0003; ignorado se ela ainda não existir)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'is_featured') then
    update public.products p set is_featured = (p.name in ('Caffè Latte', 'Iced Caramelo Macchiato', 'Caramelo Frappuccino'))
      from public.establishments e
     where e.id = p.establishment_id and e.slug = 'starbucks';
  end if;
end $$;

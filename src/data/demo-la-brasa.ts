import { assetUrl } from '@/lib/site'
import type { PublicMenu } from '@/lib/public-menu'

/**
 * La Brasa — hamburgueria usada como cardápio demonstrativo.
 * Fotos e logo: material enviado pelo cliente (public/demo/la-brasa).
 * Descrições e preços são de DEMONSTRAÇÃO (o material recebido não trazia esses dados).
 * Os mesmos dados estão em supabase/seed_demo.sql (slug "la-brasa").
 */
const img = (slug: string) => assetUrl(`/demo/la-brasa/${slug}.webp`)

const C = {
  burgers: 'c1000000-0000-4000-8000-000000000001',
  smashs: 'c1000000-0000-4000-8000-000000000002',
  doces: 'c1000000-0000-4000-8000-000000000003',
  hotdogs: 'c1000000-0000-4000-8000-000000000004',
  porcoes: 'c1000000-0000-4000-8000-000000000005',
  shakes: 'c1000000-0000-4000-8000-000000000006',
  bebidas: 'c1000000-0000-4000-8000-000000000007',
}

type Row = [category: string, name: string, description: string, price: number, photo: string]

const rows: Row[] = [
  [C.burgers, 'Costelão', 'Blend de costela na brasa, cheddar, bacon, ovo, alface, tomate e cebola roxa no pão brioche.', 42.9, 'costelao'],
  [C.burgers, 'Australiano', 'Blend bovino, cheddar derretido, bacon crocante, cebola roxa e folhas no pão australiano.', 38.9, 'australiano'],
  [C.burgers, 'La Queso', 'Blend bovino, queijo empanado crocante, bacon, alface, tomate e maionese da casa.', 39.9, 'la-queso'],
  [C.smashs, 'Smash Cheddar', 'Dois smashs prensados na chapa, cheddar, bacon e cebola caramelizada no brioche.', 32.9, 'smash-cheddar'],
  [C.smashs, 'Smash Catupiry', 'Dois smashs prensados na chapa, Catupiry original e bacon no brioche.', 34.9, 'smash-catupiry'],
  [C.doces, 'Burger Nutella', 'Pão brioche com açúcar, Nutella, morangos frescos e creme batido.', 29.9, 'burger-nutella'],
  [C.hotdogs, 'Caramelo', 'Salsicha na brasa, cheddar cremoso e farofa de bacon no pão macio.', 27.9, 'caramelo'],
  [C.hotdogs, 'Goudog', 'Salsicha na brasa, queijo gratinado e molho barbecue da casa.', 26.9, 'goudog'],
  [C.porcoes, 'Batata ondulada', 'Batata ondulada crocante, sequinha por fora e macia por dentro. Serve bem duas pessoas.', 24.9, 'batata-ondulada'],
  [C.porcoes, 'Onion rings', 'Anéis de cebola empanados e fritos na hora.', 26.9, 'onion-rings'],
  [C.shakes, 'Milkshake de morango', 'Sorvete de baunilha batido com morango, calda de morango e chantilly.', 22.9, 'milkshake-morango'],
  [C.shakes, 'Milkshake de Oreo', 'Sorvete batido com Oreo, calda de chocolate, bolinhas crocantes e chantilly.', 24.9, 'milkshake-oreo'],
  [C.bebidas, 'Coca-Cola lata', '350 ml, gelada.', 7, 'coca-cola'],
  [C.bebidas, 'Sprite lata', '350 ml, gelada.', 7, 'sprite'],
  [C.bebidas, 'Cerveja Sol long neck', '330 ml, gelada.', 12.9, 'cerveja-sol'],
  [C.bebidas, 'Jarra de suco de laranja', 'Suco natural, feito na hora. Jarra de 1 litro.', 18.9, 'jarra-suco'],
]

export const laBrasaMenu: PublicMenu = {
  establishment: {
    id: 'e0000000-0000-4000-8000-000000000002',
    name: 'La Brasa',
    slug: 'la-brasa',
    theme_key: 'la-brasa',
    external_url: null,
    tagline: 'Street burger na brasa.',
    address: 'Rua Arion Niepce da Silva, 335, Curitiba, 80610-310',
    opening_hours: 'Todos os dias · 18h30 às 23h30',
    instagram: null,
    logo_path: assetUrl('/demo/la-brasa/logo.webp'),
    updated_at: null,
  },
  categories: [
    { id: C.burgers, name: 'Burgers', position: 0 },
    { id: C.smashs, name: 'Smashs', position: 1 },
    { id: C.doces, name: 'Doces', position: 2 },
    { id: C.hotdogs, name: 'Hot dogs', position: 3 },
    { id: C.porcoes, name: 'Porções', position: 4 },
    { id: C.shakes, name: 'Milkshakes', position: 5 },
    { id: C.bebidas, name: 'Bebidas', position: 6 },
  ],
  products: rows.map(([category_id, name, description, price, photo], i) => ({
    id: `b1000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    category_id,
    name,
    description,
    price,
    image_path: img(photo),
    is_available: true,
    position: i,
  })),
}

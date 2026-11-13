import type { PublicMenu, PublicProduct } from '@/lib/public-menu'

/**
 * Starbucks — demonstração conceitual NÃO OFICIAL, sem vínculo com a marca.
 * Fotos, pôsteres e vídeo: material enviado pelo usuário (public/demo/starbucks).
 * Preços: valores de referência aprovados para a demonstração, não preços de loja.
 * Volumes Tall 300 ml / Grande 400 ml / Venti 500 ml são referências desta demo.
 * Os mesmos dados estão em supabase/seed_demo.sql (slug "starbucks").
 */
const img = (slug: string) => `/demo/starbucks/${slug}.webp`

const C = {
  quentes: 'c2000000-0000-4000-8000-000000000001',
  gelados: 'c2000000-0000-4000-8000-000000000002',
  frappuccinos: 'c2000000-0000-4000-8000-000000000003',
  comidas: 'c2000000-0000-4000-8000-000000000004',
}

const sizes = (tall: number, grande: number, venti: number) => [
  { label: 'Tall', volume_ml: 300, price: tall },
  { label: 'Grande', volume_ml: 400, price: grande },
  { label: 'Venti', volume_ml: 500, price: venti },
]

type Row = [category: string, name: string, description: string, photo: string, price: number | ReturnType<typeof sizes>]

const rows: Row[] = [
  [C.quentes, 'Caffè Latte', 'Espresso encorpado com leite vaporizado e uma camada fina de espuma.', 'caffe-latte', sizes(15.9, 17.9, 19.9)],
  [C.quentes, 'Cappuccino Tradicional', 'Espresso com partes iguais de leite vaporizado e espuma alta e cremosa.', 'cappuccino', sizes(17.9, 19.9, 21.9)],
  [C.quentes, 'Caramelo Macchiato', 'Leite vaporizado com baunilha, espresso por cima e treliça de calda de caramelo.', 'caramelo-macchiato', sizes(18.9, 20.9, 22.9)],
  [C.gelados, 'Iced Caffè Latte', 'Espresso servido sobre leite gelado e muito gelo.', 'iced-caffe-latte', sizes(15.9, 17.9, 19.9)],
  [C.gelados, 'Cold Brew', 'Café extraído a frio por longas horas: suave, encorpado e com notas de chocolate.', 'cold-brew', sizes(15.9, 17.9, 19.9)],
  [C.gelados, 'Iced Caramelo Macchiato', 'Leite gelado com baunilha, espresso e calda de caramelo por cima.', 'iced-caramelo-macchiato', sizes(18.9, 20.9, 22.9)],
  [C.frappuccinos, 'Caramelo Frappuccino', 'Café batido com gelo e caramelo, chantilly e calda de caramelo.', 'caramelo-frappuccino', sizes(22.9, 24.9, 26.9)],
  [C.frappuccinos, 'Mocha Frappuccino', 'Café, chocolate e gelo batidos, com chantilly e calda de mocha.', 'mocha-frappuccino', sizes(22.9, 24.9, 26.9)],
  [C.frappuccinos, 'Choco Chip Frappuccino', 'Chocolate com gotas de chocolate batidas com gelo, chantilly e calda de mocha.', 'choco-chip-frappuccino', sizes(22.9, 24.9, 26.9)],
  [C.comidas, 'Croissant de Presunto e Queijo', 'Croissant amanteigado, folhado e quentinho, com presunto e queijo derretido.', 'croissant-presunto-queijo', 12.65],
  [C.comidas, 'Pão de Queijo', 'Pão de queijo mineiro, casquinha dourada e miolo macio.', 'pao-de-queijo', 8.25],
  [C.comidas, 'Brownie Espresso', 'Brownie de chocolate meio amargo com um toque de espresso.', 'brownie-espresso', 12.1],
]

export const starbucksMenu: PublicMenu = {
  establishment: {
    id: 'e0000000-0000-4000-8000-000000000003',
    name: 'Starbucks',
    slug: 'starbucks',
    theme_key: 'starbucks',
    external_url: null,
    tagline: 'Demonstração conceitual não oficial.',
    address: null,
    opening_hours: null,
    instagram: null,
    logo_path: null,
    updated_at: null,
  },
  categories: [
    { id: C.quentes, name: 'Cafés quentes', position: 0 },
    { id: C.gelados, name: 'Cafés gelados', position: 1 },
    { id: C.frappuccinos, name: 'Frappuccinos', position: 2 },
    { id: C.comidas, name: 'Comidas', position: 3 },
  ],
  products: rows.map(([category_id, name, description, photo, price], i): PublicProduct => ({
    id: `b2000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    category_id,
    name,
    description,
    price: typeof price === 'number' ? price : Math.min(...price.map((v) => v.price)),
    variants: typeof price === 'number' ? null : price,
    image_path: img(photo),
    is_available: true,
    // um destaque por tipo de bebida: os dois da campanha e o clássico quente
    is_featured: ['Caffè Latte', 'Iced Caramelo Macchiato', 'Caramelo Frappuccino'].includes(name),
    position: i,
  })),
}

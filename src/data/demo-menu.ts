import type { PublicMenu } from '@/lib/public-menu'

/**
 * Casa Maré — restaurante FICTÍCIO usado na demonstração.
 * Os mesmos dados existem em supabase/seed_demo.sql (slug "demo").
 * Este arquivo só é usado quando o Supabase não está configurado ou o
 * estabelecimento "demo" ainda não foi criado.
 * Fotografias: Unsplash (licença livre).
 */
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`

const C = {
  comecar: 'c0000000-0000-4000-8000-000000000001',
  mar: 'c0000000-0000-4000-8000-000000000002',
  brasa: 'c0000000-0000-4000-8000-000000000003',
  doces: 'c0000000-0000-4000-8000-000000000004',
  beber: 'c0000000-0000-4000-8000-000000000005',
}

type Row = [category: string, name: string, description: string, price: number, photo: string, available?: boolean]

const rows: Row[] = [
  [C.comecar, 'Ceviche da casa', 'Peixe branco curado no limão, leite de tigre, milho tostado e batata-doce.', 58, 'photo-1761314036709-f6f68a3d7cf1'],
  [C.comecar, 'Ostras frescas · 6 un.', 'No gelo, com limão-cravo e vinagrete de pimenta-de-cheiro.', 72, 'photo-1729269524124-1645db0b0ff5'],
  [C.comecar, 'Lula crocante', 'Anéis empanados na farinha de milho, maionese de alho negro e limão.', 46, 'photo-1778600731531-7d836a32704c'],
  [C.comecar, 'Tostada de atum', 'Atum em cubos, manga, pepino e gergelim sobre tortilha crocante.', 49, 'photo-1769830644804-0ede2ee32a62'],
  [C.mar, 'Linguine do pescador', 'Camarão, vôngole e lula no molho de tomate assado com manjericão.', 92, 'photo-1672636401296-72fefd00e745'],
  [C.mar, 'Camarão na panela', 'Camarões grandes, tomate, coentro e pirão de leite de coco.', 108, 'photo-1762631882900-e3174bada2ed', false],
  [C.mar, 'Camarão ao alho', 'Salteado no azeite com alho dourado, páprica defumada e pão da casa.', 84, 'photo-1691201659377-978b28daa417'],
  [C.brasa, 'Polvo na brasa', 'Tentáculos grelhados, batatas ao murro e azeite de ervas.', 126, 'photo-1764397514672-63b1a7a79110'],
  [C.brasa, 'Peixe do dia', 'Filé grelhado com manteiga de limão, legumes da estação e farofa de castanha.', 98, 'photo-1665401015549-712c0dc5ef85'],
  [C.brasa, 'Travessa da maré · para 2', 'Peixe e polvo na brasa, salada verde, arroz de coentro e vinagrete.', 214, 'photo-1768322264423-4b0adf0cf31b'],
  [C.doces, 'Tiramisù de laranja', 'Mascarpone, café coado e raspas de laranja-baía.', 34, 'photo-1773418264113-4206f83e4aa7'],
  [C.doces, 'Bolo de chocolate e flor de sal', 'Fatia úmida com ganache amarga e creme fresco.', 32, 'photo-1673912402587-57ac40f1b4a5'],
  [C.doces, 'Sorvete da casa', 'Duas bolas de baunilha com crocante de castanha-de-caju.', 26, 'photo-1700482006355-ad309eff83ed'],
  [C.beber, 'Caipirinha de limão-cravo', 'Cachaça envelhecida, limão-cravo e rapadura.', 32, 'photo-1613478223460-f448a4de829d'],
  [C.beber, 'Limonada da casa', 'Limão-siciliano, hortelã e água com gás.', 16, 'photo-1512144981474-0003a89c0165'],
  [C.beber, 'Suco verde', 'Couve, abacaxi, gengibre e hortelã, batido na hora.', 18, 'photo-1662560094368-821ba04f6d0c'],
]

export const demoMenu: PublicMenu = {
  establishment: {
    id: 'e0000000-0000-4000-8000-000000000001',
    name: 'Casa Maré',
    slug: 'demo',
    theme_key: 'casa-mare',
    external_url: null,
    tagline: 'Cozinha do litoral, na brasa e no tempo certo.',
    address: 'Endereço fictício · demonstração',
    opening_hours: 'Ter a dom · 12h às 23h',
    instagram: '@casamare.demo',
    logo_path: null,
    updated_at: null,
  },
  categories: [
    { id: C.comecar, name: 'Para começar', position: 0 },
    { id: C.mar, name: 'Do mar', position: 1 },
    { id: C.brasa, name: 'Na brasa', position: 2 },
    { id: C.doces, name: 'Sobremesas', position: 3 },
    { id: C.beber, name: 'Para beber', position: 4 },
  ],
  products: rows.map(([category_id, name, description, price, photo, available = true], i) => ({
    id: `b0000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    category_id,
    name,
    description,
    price,
    image_path: img(photo),
    is_available: available,
    position: i,
  })),
}

/**
 * API pública dos cardápios — o contrato entre o Or7 Table e cada cardápio exclusivo.
 *
 * Dentro deste projeto, um cardápio novo é só um componente React que recebe
 * `PublicMenu` por props (ver src/menus/registry.ts). Os dados vêm daqui.
 *
 * Cardápio hospedado em outro projeto/domínio: use apenas a URL e a chave
 * ANON (pública) do Supabase. A chave anon não lê tabelas diretamente; ela só
 * executa as duas funções abaixo, que devolvem o que já é público:
 *
 *   import { createClient } from '@supabase/supabase-js'
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *   const { data } = await supabase.rpc('get_public_menu', { p_slug: 'nome-do-local' })
 *   // data: { establishment, categories, products } ou null se inativo/inexistente
 *   await supabase.rpc('register_menu_view', { p_slug: 'nome-do-local', p_source: 'link' })
 *
 *   Fotos: `image_path` pode ser URL absoluta ou caminho no Storage. Para caminhos:
 *   `${SUPABASE_URL}/storage/v1/object/public/menu-media/${image_path}`
 *
 * Sem fetch do Supabase? A mesma chamada via REST:
 *   POST {SUPABASE_URL}/rest/v1/rpc/get_public_menu
 *   headers: apikey: {ANON_KEY}, Content-Type: application/json
 *   body: {"p_slug":"nome-do-local"}
 */
import { mediaUrl, supabase } from './supabase'

export interface PublicEstablishment {
  id: string
  name: string
  slug: string
  theme_key: string
  external_url: string | null
  tagline: string | null
  address: string | null
  opening_hours: string | null
  instagram: string | null
  logo_path: string | null
  updated_at: string | null
}

export interface PublicCategory {
  id: string
  name: string
  position: number
}

export interface PublicProduct {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  /** Tamanhos com preço próprio (opcional). Sem variantes, vale price. */
  variants?: Array<{ label: string; volume_ml?: number | null; price: number }> | null
  image_path: string | null
  is_available: boolean
  /** Destaque escolhido pelo restaurante (migração 0003). */
  is_featured?: boolean
  position: number
}

export interface PublicMenu {
  establishment: PublicEstablishment
  categories: PublicCategory[]
  products: PublicProduct[]
}

/** Props recebidas por todo cardápio exclusivo. */
export interface MenuThemeProps {
  menu: PublicMenu
  /** true quando os dados são o exemplo fictício embutido (sem Supabase). */
  isDemoData?: boolean
  /** Renderizado dentro de uma moldura (landing page) e não em tela cheia. */
  embedded?: boolean
  /** Prévia decorativa: sem animações por item nem observadores (mais leve). */
  lite?: boolean
}

export async function fetchPublicMenu(slug: string): Promise<PublicMenu | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_public_menu', { p_slug: slug })
  if (error) throw error
  if (!data) return null
  const menu = data as PublicMenu
  menu.products = menu.products.map((p) => ({
    ...p,
    price: Number(p.price),
    variants: p.variants?.map((v) => ({ ...v, price: Number(v.price) })) ?? null,
  }))
  return menu
}

const VIEWED_KEY = 'or7table:viewed'

/** Uma visita por aba/sessão do navegador. Sem cookies e sem dados pessoais. */
export async function registerMenuView(slug: string, source: 'qr' | 'link') {
  if (!supabase) return
  try {
    const seen = new Set<string>(JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? '[]'))
    if (seen.has(slug)) return
    seen.add(slug)
    sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...seen]))
  } catch {
    /* sessionStorage indisponível: registra mesmo assim */
  }
  await supabase.rpc('register_menu_view', { p_slug: slug, p_source: source })
}

export function productImage(path: string | null, width = 900): string | null {
  const url = mediaUrl(path)
  if (!url) return null
  // fotos dos cardápios demonstrativos têm uma versão leve para miniaturas
  if (url.startsWith('/demo/') && width <= 480) return url.replace(/(-2)?\.webp$/, (m, alt) => (alt ? m : '-sm.webp'))
  if (url.includes('images.unsplash.com')) {
    return url.replace(/([?&])w=\d+/, `$1w=${width}`)
  }
  return url
}

export function groupByCategory(menu: PublicMenu) {
  return menu.categories
    .map((category) => ({
      category,
      products: menu.products.filter((p) => p.category_id === category.id),
    }))
    .filter((g) => g.products.length > 0)
}

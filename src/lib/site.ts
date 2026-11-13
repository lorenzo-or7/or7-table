const configured = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim().replace(/\/+$/, '')

/** Base pública usada nos QR Codes. Sem configuração, usa o endereço atual. */
export function publicSiteUrl() {
  return configured || window.location.origin
}

export const isSiteUrlConfigured = Boolean(configured)

export function publicMenuUrl(slug: string) {
  return `${publicSiteUrl()}/table/${slug}`
}

/** Endereço gravado no QR Code: permanente; `src=qr` só separa a origem no Analytics. */
export function qrMenuUrl(slug: string) {
  return `${publicSiteUrl()}/table/${slug}?src=qr`
}

/* ------------------------------------------------------------ contato comercial */

/** WhatsApp oficial da Or7 (pode ser trocado por VITE_CONTACT_WHATSAPP). */
export const WHATSAPP_NUMBER = (import.meta.env.VITE_CONTACT_WHATSAPP as string | undefined)?.replace(/\D/g, '') || '5541996262776'
export const WHATSAPP_DISPLAY = WHATSAPP_NUMBER === '5541996262776' ? '+55 41 99626-2776' : `+${WHATSAPP_NUMBER}`
export const INSTAGRAM_URL = 'https://www.instagram.com/or7.dev/'
export const INSTAGRAM_HANDLE = '@or7.dev'
export const GITHUB_URL = 'https://github.com/lorenzo-or7'
export const GITHUB_HANDLE = 'lorenzo-or7'
export const CONTACT_EMAIL =(import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || null

const messages = {
  demo: 'Olá! Tenho interesse no Or7 Table e gostaria de solicitar uma demonstração.',
  proposal: 'Olá! Tenho interesse em receber uma proposta do Or7 Table para o meu estabelecimento.',
  hiring: 'Olá! Quero entender melhor como funciona a contratação do Or7 Table.',
  question: 'Olá! Tenho uma dúvida sobre o Or7 Table.',
  general: 'Olá! Vim pelo site do Or7 Table e gostaria de conversar.',
} as const

export type ContactIntent = keyof typeof messages

export function whatsappHref(intent: ContactIntent = 'demo') {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messages[intent])}`
}

export const DEMO_SLUG = 'demo'
export const LA_BRASA_SLUG = 'la-brasa'
export const STARBUCKS_SLUG = 'starbucks'

/** Cardápios demonstrativos oficiais exibidos na landing page. */
export const demoMenus = [
  { slug: DEMO_SLUG, name: 'Casa Maré', kind: 'Frutos do mar' },
  { slug: LA_BRASA_SLUG, name: 'La Brasa', kind: 'Hamburgueria' },
  { slug: STARBUCKS_SLUG, name: 'Starbucks', kind: 'Cafeteria · demo não oficial' },
] as const

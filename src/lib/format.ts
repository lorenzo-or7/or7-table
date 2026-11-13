const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number | string | null | undefined) {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0)
  return brl.format(Number.isFinite(n) ? n : 0)
}

/** Preço curto para cardápios: "58" ou "58,90". */
export function formatPriceShort(value: number) {
  const fixed = value.toFixed(2).replace('.', ',')
  return fixed.endsWith(',00') ? fixed.slice(0, -3) : fixed
}

/** "1.234,5" | "1234,50" | "12.5" → 1234.5 */
export function parseBRL(input: string): number | null {
  const clean = input.replace(/[^\d,.-]/g, '').trim()
  if (!clean) return null
  let normalized = clean
  if (clean.includes(',')) normalized = clean.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

export function priceToInput(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return ''
  // numeric do Postgres pode chegar como texto: normaliza antes de formatar
  return Number(value).toFixed(2).replace('.', ',')
}

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function initials(name: string | null | undefined, fallback = '?') {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase() || fallback
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return dateFmt.format(new Date(iso))
}

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`
}

export const isValidEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

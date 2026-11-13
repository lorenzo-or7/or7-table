import { useCallback, useEffect, useRef, useState } from 'react'
import { MEDIA_BUCKET, requireSupabase } from './supabase'
import type { Account, SecurityEvent, Billing, Category, Establishment, OwnerInvite, Payment, PaymentMethod, Product, Profile } from './types'

/* ------------------------------------------------------------------ hook */

export function useLoader<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const result = await fnRef.current()
      setData(result)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, setData, error, loading, reload }
}

const db = () => requireSupabase()

function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error
  return res.data as T
}

/* ------------------------------------------------------------ establishments */

export async function listEstablishments() {
  return check(await db().from('establishments').select('*').order('created_at', { ascending: false })) as Establishment[]
}

export async function getEstablishment(id: string) {
  return check(await db().from('establishments').select('*').eq('id', id).single()) as Establishment
}

export type EstablishmentInput = Omit<Establishment, 'id' | 'created_at' | 'updated_at'>

export async function saveEstablishment(input: EstablishmentInput, id?: string) {
  if (id) return check(await db().from('establishments').update(input).eq('id', id).select().single()) as Establishment
  return check(await db().from('establishments').insert(input).select().single()) as Establishment
}

export async function deleteEstablishment(id: string) {
  check(await db().from('establishments').delete().eq('id', id))
}

export async function listBilling() {
  return (check(await db().from('establishment_billing').select('*')) as Billing[]).map((b) => ({ ...b, monthly_fee: Number(b.monthly_fee) }))
}

export async function saveBilling(
  establishment_id: string,
  monthly_fee: number,
  notes: string | null,
  contract?: { contract_start: string | null; due_day: number | null },
) {
  check(await db().from('establishment_billing').upsert({ establishment_id, monthly_fee, notes, ...(contract ?? {}) }))
}

/* ------------------------------------------------------------ financeiro (manual) */

export async function listPayments() {
  return (check(await db().from('billing_payments').select('*').order('reference_month', { ascending: false }).order('paid_at', { ascending: false })) as Payment[]).map(
    // datas puras (AAAA-MM-DD), sem fuso: comparações por mês ficam exatas
    (p) => ({ ...p, amount: Number(p.amount), reference_month: String(p.reference_month).slice(0, 10), paid_at: String(p.paid_at).slice(0, 10) }),
  )
}

export type PaymentInput = { establishment_id: string; reference_month: string; amount: number; paid_at: string; method: PaymentMethod | null; notes: string | null }

export async function createPayment(input: PaymentInput) {
  return check(await db().from('billing_payments').insert(input).select().single()) as Payment
}

export async function deletePayment(id: string) {
  check(await db().from('billing_payments').delete().eq('id', id))
}

/* ------------------------------------------------------------ profiles */

/** Últimos eventos de segurança (Super Admin com aal2). Sem a migração 0004, devolve null. */
export async function listSecurityEvents(limit = 20): Promise<SecurityEvent[] | null> {
  const res = await db().from('security_events').select('*').order('created_at', { ascending: false }).limit(limit)
  if (res.error) return null
  return res.data as SecurityEvent[]
}

/** Contas com status de acesso. Sem a migração 0003, cai para os perfis sem datas de acesso. */
export async function listAccounts(): Promise<Account[]> {
  const res = await db().rpc('admin_accounts')
  if (!res.error) return res.data as Account[]
  const missing = /admin_accounts|PGRST202|could not find/i.test(`${res.error.message} ${res.error.code}`)
  if (!missing) throw res.error
  const profiles = await listProfiles()
  return profiles.map((p) => ({ ...p, invited_at: null, confirmed_at: null, last_sign_in_at: null }))
}

export async function listProfiles() {
  return check(await db().from('profiles').select('*').order('created_at', { ascending: false })) as Profile[]
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile, 'full_name' | 'establishment_id'>>) {
  check(await db().from('profiles').update(patch).eq('id', id))
}

export async function listInvites() {
  return check(
    await db().from('owner_invites').select('*').is('accepted_at', null).order('created_at', { ascending: false }),
  ) as OwnerInvite[]
}

export async function createInviteRecord(email: string, full_name: string | null, establishment_id: string) {
  const sb = db()
  await sb.from('owner_invites').delete().ilike('email', email).is('accepted_at', null)
  check(await sb.from('owner_invites').insert({ email, full_name, establishment_id }))
}

export async function deleteInvite(id: string) {
  check(await db().from('owner_invites').delete().eq('id', id))
}

/** Chama a Edge Function segura de provisionamento (service_role fica no servidor). */
export async function callInviteFunction(body: Record<string, unknown>) {
  const { data, error } = await db().functions.invoke('invite-owner', { body })
  if (error) {
    let message = error.message
    try {
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        const parsed = await ctx.json()
        if (parsed?.error) message = parsed.error
      }
    } catch {
      /* mantém a mensagem original */
    }
    const err = new Error(message) as Error & { notDeployed?: boolean }
    err.notDeployed = /failed to send|not found|404|fetch/i.test(error.message)
    throw err
  }
  return data as { status: string }
}

/* ------------------------------------------------------------ categories */

export async function listCategories(establishmentId: string) {
  return check(
    await db().from('categories').select('*').eq('establishment_id', establishmentId).order('position').order('created_at'),
  ) as Category[]
}

export async function createCategory(establishmentId: string, name: string, position: number) {
  return check(
    await db().from('categories').insert({ establishment_id: establishmentId, name, position }).select().single(),
  ) as Category
}

export async function renameCategory(id: string, name: string) {
  check(await db().from('categories').update({ name }).eq('id', id))
}

export async function reorderCategories(ordered: Category[]) {
  const sb = db()
  const results = await Promise.all(ordered.map((c, i) => sb.from('categories').update({ position: i }).eq('id', c.id)))
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export async function deleteCategory(id: string) {
  check(await db().from('categories').delete().eq('id', id))
}

/* ------------------------------------------------------------ products */

export async function listProducts(establishmentId: string) {
  return check(
    await db().from('products').select('*').eq('establishment_id', establishmentId).order('position').order('created_at'),
  ).map((p: Product) => ({ ...p, price: Number(p.price) })) as Product[]
}

export type ProductInput = Pick<Product, 'name' | 'description' | 'price' | 'category_id' | 'is_available' | 'image_path'> & {
  variants?: Product['variants']
  is_featured?: boolean
}

export async function saveProduct(establishmentId: string, input: ProductInput, id?: string) {
  const sb = db()
  if (id) return check(await sb.from('products').update(input).eq('id', id).select().single()) as Product
  const { count } = await sb.from('products').select('id', { count: 'exact', head: true }).eq('establishment_id', establishmentId)
  return check(
    await sb
      .from('products')
      .insert({ ...input, establishment_id: establishmentId, position: count ?? 0 })
      .select()
      .single(),
  ) as Product
}

export async function setProductAvailability(id: string, is_available: boolean) {
  check(await db().from('products').update({ is_available }).eq('id', id))
}

export async function setProductFeatured(id: string, is_featured: boolean) {
  check(await db().from('products').update({ is_featured }).eq('id', id))
}

export async function setProductImage(id: string, image_path: string | null) {
  check(await db().from('products').update({ image_path }).eq('id', id))
}

export async function moveProductsToCategory(fromCategory: string, toCategory: string) {
  check(await db().from('products').update({ category_id: toCategory }).eq('category_id', fromCategory))
}

export async function deleteProductsInCategory(categoryId: string) {
  const sb = db()
  const items = check(await sb.from('products').select('image_path').eq('category_id', categoryId)) as Pick<Product, 'image_path'>[]
  check(await sb.from('products').delete().eq('category_id', categoryId))
  await removeMedia(items.map((i) => i.image_path))
}

export async function deleteProduct(product: Product) {
  check(await db().from('products').delete().eq('id', product.id))
  await removeMedia([product.image_path])
}

/* ------------------------------------------------------------ media */

export const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGES.includes(file.type)) return 'Envie uma foto em JPG, PNG ou WEBP.'
  if (file.size > 15 * 1024 * 1024) return 'Foto grande demais. Envie uma imagem de até 15 MB.'
  return null
}

/**
 * Reduz a foto no navegador antes do envio (máx. 1600px, WEBP ~82%),
 * para o cardápio carregar rápido no 4G do cliente.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (!blob) return file
  return blob.size < file.size || file.size > MAX_IMAGE_BYTES ? blob : file
}

export async function uploadMedia(establishmentId: string, folder: 'products' | 'brand', file: File) {
  const blob = await compressImage(file, folder === 'brand' ? 800 : 1600)
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('Mesmo comprimida, a foto passou de 5 MB. Tente outra imagem.')
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${establishmentId}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await db().storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType: blob.type || file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw error
  return path
}

/** Remove arquivos do Storage (ignora URLs externas, como as fotos da demonstração). */
export async function removeMedia(paths: Array<string | null | undefined>) {
  const own = paths.filter((p): p is string => Boolean(p) && !/^https?:\/\//.test(p!) && !p!.startsWith('/'))
  if (!own.length) return
  await db().storage.from(MEDIA_BUCKET).remove(own)
}

/* ------------------------------------------------------------ analytics */

export interface ViewStat {
  day: string
  establishment_id: string
  source: 'qr' | 'link'
  views: number
}

export async function viewStats(days: number) {
  const rows = check(await db().rpc('admin_view_stats', { p_days: days })) as ViewStat[]
  return rows.map((r) => ({ ...r, day: String(r.day).slice(0, 10), views: Number(r.views) }))
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { assetUrl } from './site'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const isSupabaseConfigured = Boolean(
  url && anonKey && /^https?:\/\/.+/.test(url) && !url.includes('SEU-PROJETO'),
)

const REMEMBER_KEY = 'or7table:remember'

/** "Manter conectado": sessão em localStorage; caso contrário, só nesta aba. */
export function setRememberSession(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  } catch {
    /* navegação privada */
  }
}

function pickStorage(): Storage | null {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '0' ? sessionStorage : localStorage
  } catch {
    return null
  }
}

const authStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      const target = pickStorage()
      if (!target) return
      const other = target === localStorage ? sessionStorage : localStorage
      other.removeItem(key)
      target.setItem(key, value)
    } catch {
      /* ignore */
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

/**
 * Cliente único. Quando o projeto ainda não tem .env configurado, `supabase`
 * fica null e as telas mostram o aviso de configuração em vez de quebrar.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        storage: authStorage,
      },
    })
  : null

export const supabaseUrl = url ?? ''

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}

export const MEDIA_BUCKET = 'menu-media'

/** Converte um caminho do Storage (ou URL absoluta) em endereço público. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  // URL absoluta ou arquivo do próprio site (fotos dos cardápios demonstrativos)
  if (/^https?:\/\//.test(path)) return path
  if (path.startsWith('/')) return assetUrl(path)
  if (!url) return null
  return `${url}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`
}

/** Mensagens do Supabase/PostgREST em português claro. */
export function friendlyError(error: unknown): string {
  const raw =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : ''
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : ''
  const msg = raw.toLowerCase()

  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('email not confirmed')) return 'Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.'
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'Sem conexão com o servidor. Verifique sua internet.'
  if (msg.includes('password should be') || msg.includes('weak password')) return 'A senha precisa ter pelo menos 8 caracteres, com letras e números.'
  if (msg.includes('same password') || msg.includes('should be different')) return 'Escolha uma senha diferente da atual.'
  // migração 0003 ainda não aplicada no projeto
  if (code === '42P01' || code === 'PGRST205' || (msg.includes('billing_payments') && (msg.includes('does not exist') || msg.includes('could not find'))))
    return 'O banco ainda não tem as tabelas mais recentes. Rode supabase/migrations/0003_finalization.sql no SQL Editor do Supabase.'
  if (code === '42703' && msg.includes('is_featured')) return 'Rode a migração 0003_finalization.sql para usar os destaques.'
  if (code === '23505' || msg.includes('duplicate key')) {
    if (msg.includes('slug')) return 'Este endereço já está em uso por outro estabelecimento.'
    return 'Já existe um registro com esses dados.'
  }
  if (code === '23503' || msg.includes('foreign key')) return 'Este item ainda está vinculado a outros registros.'
  if (code === '42501' || msg.includes('row-level security') || msg.includes('permission denied'))
    return 'Você não tem permissão para esta ação.'
  if (msg.includes('payload too large') || msg.includes('exceeded the maximum')) return 'Arquivo grande demais. Envie uma imagem de até 5 MB.'
  if (msg.includes('jwt') || msg.includes('session')) return 'Sua sessão expirou. Entre novamente.'
  return raw || 'Algo deu errado. Tente novamente.'
}

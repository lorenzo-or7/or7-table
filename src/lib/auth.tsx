import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { bootMark } from './boot'
import type { Profile } from './types'

/**
 * Situação do segundo fator (TOTP) na sessão atual:
 *  none      → sem sessão
 *  enroll    → senha ok, mas ainda sem Authenticator cadastrado (primeiro acesso)
 *  challenge → senha ok, Authenticator cadastrado, falta digitar o código
 *  ok        → sessão aal2: o painel pode abrir (as permissões ainda são checadas pelo papel)
 *  unavailable → o servidor de autenticação não respondeu (rede/instabilidade): nada é liberado,
 *               a sessão é mantida e a tela oferece "Tentar de novo"
 * O banco aplica a mesma regra (migração 0004): com aal1 nenhuma tabela administrativa responde.
 */
export type MfaState = 'none' | 'enroll' | 'challenge' | 'ok' | 'unavailable'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  mfa: MfaState
  /** Relê o nível da sessão (após verificar um código, por exemplo). */
  refreshMfa: () => Promise<MfaState>
  /** true quando o usuário chegou por link de convite/recuperação de senha */
  recovery: boolean
  refreshProfile: () => Promise<Profile | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const EXPIRED_KEY = 'or7table:session-expired'

/** true uma única vez depois que a sessão caiu sem o usuário clicar em Sair (token vencido/revogado). */
export function consumeSessionExpired() {
  try {
    const v = sessionStorage.getItem(EXPIRED_KEY) === '1'
    sessionStorage.removeItem(EXPIRED_KEY)
    return v
  } catch {
    return false
  }
}

/** Havia sessão salva neste navegador antes de o app iniciar? */
function hasStoredSession() {
  try {
    return [localStorage, sessionStorage].some((st) => Object.keys(st).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token')))
  } catch {
    return false
  }
}

function markExpired() {
  try {
    sessionStorage.setItem(EXPIRED_KEY, '1')
  } catch {
    /* navegação privada */
  }
}

export async function readMfaState(): Promise<MfaState> {
  if (!supabase) return 'none'
  let res
  try {
    res = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  } catch {
    return 'unavailable'
  }
  const { data, error } = res
  if (error) {
    // falha de rede ou do servidor não é o mesmo que sessão inválida: não desloga, mas também não libera
    const status = (error as { status?: number }).status ?? 0
    if (error.name === 'AuthRetryableFetchError' || status === 0 || status >= 500) return 'unavailable'
    return 'none'
  }
  if (!data?.currentLevel) return 'none'
  if (data.currentLevel === 'aal2') return 'ok'
  return data.nextLevel === 'aal2' ? 'challenge' : 'enroll'
}

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return (data as Profile | null) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [mfa, setMfa] = useState<MfaState>('none')
  const [recovery, setRecovery] = useState(() => /type=(recovery|invite)/.test(window.location.hash))
  const manualSignOut = useRef(false)
  const hadSession = useRef(false)
  const hadStored = useRef(hasStoredSession())

  useEffect(() => {
    if (!supabase) {
      bootMark('session')
      bootMark('profile')
      return
    }
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      hadSession.current = Boolean(data.session)
      // havia sessão salva e ela não vale mais (token vencido sem renovação possível): avisa no login
      if (hadStored.current && !data.session) markExpired()
      bootMark('session')
      let level = data.session ? await readMfaState() : 'none'
      if (!active) return
      if (data.session && level === 'none') {
        // token salvo que o servidor não reconhece (revogado, usuário removido): encerra a sessão local
        markExpired()
        await supabase?.auth.signOut({ scope: 'local' }).catch(() => undefined)
        level = 'none'
      }
      setMfa(level)
      // perfil e papel só são lidos depois do segundo fator (com aal1 o banco não os entrega)
      setProfile(data.session && level === 'ok' ? await loadProfile(data.session.user.id) : null)
      bootMark('profile')
      if (active) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT' && hadSession.current && !manualSignOut.current) {
        try {
          sessionStorage.setItem(EXPIRED_KEY, '1')
        } catch {
          /* navegação privada */
        }
      }
      if (event === 'SIGNED_OUT') manualSignOut.current = false
      hadSession.current = Boolean(next)
      setSession(next)
      if (!next) {
        setProfile(null)
        setMfa('none')
        return
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY' || event === 'MFA_CHALLENGE_VERIFIED' || event === 'TOKEN_REFRESHED') {
        // fora do callback para não travar o cliente de auth
        setTimeout(async () => {
          const level = await readMfaState()
          if (!active) return
          setMfa(level)
          if (level === 'ok') loadProfile(next.user.id).then((p) => active && setProfile(p))
          else setProfile(null)
        }, 0)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const refreshMfa = useCallback(async () => {
    const level = await readMfaState()
    setMfa(level)
    return level
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session) return null
    if ((await readMfaState()) !== 'ok') {
      setProfile(null)
      return null
    }
    const p = await loadProfile(session.user.id)
    setProfile(p)
    return p
  }, [session])

  const signOut = useCallback(async () => {
    if (!supabase) return
    manualSignOut.current = true
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setMfa('none')
    setRecovery(false)
  }, [])

  const value = useMemo(
    () => ({ session, profile, loading, mfa, refreshMfa, recovery, refreshProfile, signOut }),
    [session, profile, loading, mfa, refreshMfa, recovery, refreshProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return ctx
}

export function homeFor(profile: Profile | null) {
  if (!profile) return '/entrar'
  return profile.role === 'super_admin' ? '/admin' : '/painel'
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Check, Lock } from 'lucide-react'
import { AuthShell, ConfigNotice } from '@/components/auth/AuthShell'
import { Button, ButtonLink, Spinner, cn } from '@/components/ui/primitives'
import { homeFor, useAuth } from '@/lib/auth'
import { friendlyError, isSupabaseConfigured, supabase } from '@/lib/supabase'

function strength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

/** Chegada por link de convite ou de recuperação: o usuário define a senha. */
export default function ResetPassword() {
  const { session, loading, refreshProfile, refreshMfa } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const isInvite = /type=invite/.test(window.location.hash)
  const score = strength(password)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Use pelo menos 8 caracteres, com letras e números.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setBusy(false)
      setError(friendlyError(updateError))
      return
    }
    // senha definida: o próximo passo é o Authenticator (obrigatório para todo painel)
    const level = await refreshMfa()
    const profile = level === 'ok' ? await refreshProfile() : null
    setBusy(false)
    setDone(true)
    window.setTimeout(() => navigate(level === 'ok' ? homeFor(profile) : '/verificacao', { replace: true }), 1200)
  }

  const heading = isInvite ? 'Bem-vindo\nao Or7 Table.' : 'Nova senha,\nmesmo painel.'

  return (
    <AuthShell stage={done ? 'granted' : error ? 'error' : session ? 'identified' : 'idle'} eyebrow={isInvite ? 'Convite' : 'Recuperação'} heading={heading}>
      {!isSupabaseConfigured && <ConfigNotice />}
      {loading ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : !session ? (
        <div>
          <p className="eyebrow text-red-soft">Link inválido ou expirado</p>
          <h1 className="mt-3 text-[2rem] leading-tight font-semibold text-cream">Não conseguimos validar o link.</h1>
          <p className="mt-2.5 leading-relaxed text-mist">
            Links de convite e recuperação valem por tempo limitado e só podem ser usados uma vez. Peça um novo link na tela de login.
          </p>
          <ButtonLink to="/entrar" size="lg" className="mt-8 h-[54px] w-full rounded-[10px]">
            Ir para o login
          </ButtonLink>
        </div>
      ) : done ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status">
          <span className="grid size-14 place-items-center rounded-2xl border border-mint/30 bg-mint/10 text-mint">
            <Check className="size-6" aria-hidden />
          </span>
          <h1 className="mt-8 text-[2.1rem] font-semibold text-cream">Senha salva.</h1>
          <p className="mt-2.5 text-mist">Abrindo seu painel…</p>
        </motion.div>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="eyebrow text-gold">{isInvite ? 'Primeiro acesso' : 'Redefinir senha'}</p>
          <h1 className="mt-3 text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-cream">Crie sua senha.</h1>
          <p className="mt-2.5 leading-relaxed text-mist">
            Conta: <span className="text-cream">{session.user.email}</span>
          </p>
          <div className="mt-8 grid gap-4">
            {[
              { id: 'pw', label: 'Nova senha', value: password, set: setPassword, auto: 'new-password' },
              { id: 'pw2', label: 'Confirme a senha', value: confirm, set: setConfirm, auto: 'new-password' },
            ].map((f) => (
              <label key={f.id} className="grid gap-2 text-sm font-medium text-cream/90">
                {f.label}
                <span className="flex h-[52px] items-center rounded-xl border border-white/10 bg-navy-950/80 focus-within:border-gold/70 focus-within:shadow-[0_0_0_3px_rgb(255_170_0/0.14)]">
                  <Lock className="ml-4 size-4 text-dim" aria-hidden />
                  <input
                    type="password"
                    autoComplete={f.auto}
                    value={f.value}
                    onChange={(e) => {
                      f.set(e.target.value)
                      setError(null)
                    }}
                    className="h-full w-full min-w-0 bg-transparent px-3 text-cream outline-none"
                  />
                </span>
              </label>
            ))}
            <div aria-hidden className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < score ? (score >= 3 ? 'bg-mint' : score === 2 ? 'bg-gold' : 'bg-red-soft') : 'bg-white/10',
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-dim">Mínimo de 8 caracteres, com letras e números.</p>
            {error && (
              <p role="alert" className="text-sm text-red-soft">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" loading={busy} className="mt-2 w-full rounded-xl">
              Salvar senha e entrar
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  )
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Check, Lock, Mail, MailCheck } from 'lucide-react'
import { AuthShell, ConfigNotice, StepProgress, type AuthStage } from '@/components/auth/AuthShell'
import { Button, cn } from '@/components/ui/primitives'
import { consumeSessionExpired, homeFor, useAuth } from '@/lib/auth'
import { publicSiteUrl } from '@/lib/site'
import { friendlyError, isSupabaseConfigured, setRememberSession, supabase } from '@/lib/supabase'
import { isValidEmail } from '@/lib/format'
import type { Profile } from '@/lib/types'

type Step = 'email' | 'password' | 'forgot' | 'sent' | 'success'

const fade = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
}

function InputShell({ icon, children, invalid }: { icon: React.ReactNode; children: React.ReactNode; invalid?: boolean }) {
  return (
    <span
      className={cn(
        'flex h-[54px] items-center rounded-[10px] border bg-navy-950/80 transition-[border-color,box-shadow] duration-200 focus-within:border-gold/70 focus-within:shadow-[0_0_0_3px_rgb(255_170_0/0.14)]',
        invalid ? 'border-red-soft/60' : 'border-white/10 hover:border-white/20',
      )}
    >
      <span className="ml-4 text-dim [&>svg]:size-4" aria-hidden>
        {icon}
      </span>
      {children}
    </span>
  )
}

export default function Login() {
  const { session, profile, loading, mfa, refreshMfa } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [expired] = useState(consumeSessionExpired)
  const passwordRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // já autenticado: vai direto para a área certa (ou para o segundo fator, se faltar)
  useEffect(() => {
    if (loading || !session || step === 'success') return
    if (mfa === 'enroll' || mfa === 'challenge') navigate('/verificacao', { replace: true, state: location.state })
    else if (profile) navigate(homeFor(profile), { replace: true })
  }, [loading, session, profile, mfa, navigate, step, location.state])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (step === 'password') passwordRef.current?.focus()
      if (step === 'email' || step === 'forgot') emailRef.current?.focus()
    }, 380)
    return () => window.clearTimeout(t)
  }, [step])

  const stage: AuthStage = error ? 'error' : step === 'success' ? 'granted' : step === 'password' ? 'identified' : 'idle'

  const continueEmail = (e: FormEvent) => {
    e.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!isValidEmail(normalized)) {
      setError('Digite um e-mail válido para continuar.')
      return
    }
    setEmail(normalized)
    setError(null)
    setStep('password')
  }

  const signIn = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (!password) {
      setError('Digite sua senha.')
      return
    }
    setBusy(true)
    setError(null)
    setRememberSession(remember)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setBusy(false)
      setError(friendlyError(authError))
      return
    }
    const target = (location.state as { from?: string } | null)?.from
    // senha confere: o painel só abre depois do código do Authenticator (aal2)
    const level = await refreshMfa()
    if (level !== 'ok') {
      setBusy(false)
      navigate('/verificacao', { replace: true, state: { from: target } })
      return
    }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
    setBusy(false)
    setStep('success')
    const home = homeFor((p as Profile | null) ?? null)
    window.setTimeout(() => {
      navigate(target && target.startsWith(home) ? target : home, { replace: true })
    }, 900)
  }

  const sendReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    const normalized = email.trim().toLowerCase()
    if (!isValidEmail(normalized)) {
      setError('Digite o e-mail cadastrado.')
      return
    }
    setBusy(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${publicSiteUrl()}/redefinir-senha`,
    })
    setBusy(false)
    if (resetError) {
      setError(friendlyError(resetError))
      return
    }
    setStep('sent')
  }

  const progressStep = step === 'password' || step === 'success' ? 1 : 0

  return (
    <AuthShell stage={stage}>
      {!isSupabaseConfigured && <ConfigNotice />}
      {expired && step === 'email' && (
        <p role="status" className="mb-6 rounded-[10px] border border-gold/25 bg-gold/[0.07] px-4 py-3 text-sm leading-relaxed text-cream">
          Sua sessão expirou por segurança. Entre de novo para continuar de onde parou.
        </p>
      )}
      <AnimatePresence mode="wait">
        {(step === 'email' || step === 'password') && (
          <motion.div key="signin" {...fade}>
            <StepProgress step={progressStep} labels={['E-mail', 'Senha']} />
            <p className="eyebrow text-gold">{step === 'email' ? 'Bem-vindo' : 'Quase lá'}</p>
            <h1 className="mt-3 text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-cream">
              {step === 'email' ? 'Entre no seu painel.' : 'Agora, sua senha.'}
            </h1>
            <p className="mt-2.5 leading-relaxed text-mist">
              {step === 'email' ? 'Use o e-mail cadastrado pela equipe Or7.' : 'Digite a senha da sua conta para continuar.'}
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {step === 'email' ? (
                <motion.form key="f-email" {...fade} onSubmit={continueEmail} noValidate className="mt-8 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium text-cream/90">
                    E-mail
                    <InputShell icon={<Mail />} invalid={Boolean(error)}>
                      <input
                        ref={emailRef}
                        aria-label="E-mail"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="voce@seurestaurante.com.br"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setError(null)
                        }}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? 'login-error' : undefined}
                        className="h-full w-full min-w-0 bg-transparent px-3 text-[0.98rem] text-cream outline-none placeholder:text-dim/70"
                      />
                    </InputShell>
                  </label>
                  {error && (
                    <p id="login-error" role="alert" className="-mt-1 text-sm text-red-soft">
                      {error}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="mt-2 h-[54px] w-full justify-between rounded-[10px] px-5" disabled={!isSupabaseConfigured}>
                    Continuar
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Button>
                </motion.form>
              ) : (
                <motion.form key="f-pass" {...fade} onSubmit={signIn} noValidate className="mt-8 grid gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-navy-950/60 p-2 pr-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-gold/15 text-sm font-semibold text-gold">
                      {email.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-cream/90">{email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email')
                        setPassword('')
                        setError(null)
                      }}
                      className="rounded-md px-2 py-1 text-sm text-gold-soft hover:bg-white/[0.05]"
                    >
                      Trocar
                    </button>
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-cream/90">
                    Senha
                    <InputShell icon={<Lock />} invalid={Boolean(error)}>
                      <input
                        ref={passwordRef}
                        aria-label="Senha"
                        type={show ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError(null)
                        }}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? 'login-error' : undefined}
                        className="h-full w-full min-w-0 bg-transparent px-3 text-[0.98rem] text-cream outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={show}
                        className="mr-2 rounded-lg px-2.5 py-1.5 font-[family-name:var(--font-ui)] text-[11px] font-semibold tracking-[0.08em] text-gold-soft hover:bg-white/[0.05]"
                      >
                        {show ? 'OCULTAR' : 'MOSTRAR'}
                      </button>
                    </InputShell>
                  </label>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex cursor-pointer items-center gap-2.5 text-mist">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
                      <span className="grid size-[18px] place-items-center rounded-[5px] border border-white/25 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold">
                        {remember && <Check className="size-3 text-navy-950" strokeWidth={3} aria-hidden />}
                      </span>
                      Manter conectado
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('forgot')
                        setError(null)
                      }}
                      className="rounded-md px-1 text-gold-soft hover:underline"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  {error && (
                    <p id="login-error" role="alert" className="-mt-1 text-sm text-red-soft">
                      {error}
                    </p>
                  )}
                  <Button type="submit" size="lg" loading={busy} className="mt-2 h-[54px] w-full justify-between rounded-[10px] px-5" disabled={!isSupabaseConfigured}>
                    Entrar
                    {!busy && <ArrowUpRight className="size-4" aria-hidden />}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'forgot' && (
          <motion.form key="forgot" {...fade} onSubmit={sendReset} noValidate>
            <button
              type="button"
              onClick={() => {
                setStep(email ? 'password' : 'email')
                setError(null)
              }}
              className="mb-8 inline-flex items-center gap-2 rounded-full py-1 pr-3 text-sm text-mist hover:text-cream"
            >
              <ArrowLeft className="size-4" aria-hidden /> Voltar
            </button>
            <p className="eyebrow text-gold">Recuperar acesso</p>
            <h1 className="mt-3 text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-cream">Vamos criar uma nova senha.</h1>
            <p className="mt-2.5 leading-relaxed text-mist">Enviaremos um link para o e-mail cadastrado. Ele vale por tempo limitado.</p>
            <label className="mt-8 grid gap-2 text-sm font-medium text-cream/90">
              E-mail
              <InputShell icon={<Mail />} invalid={Boolean(error)}>
                <input
                  ref={emailRef}
                  aria-label="E-mail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  aria-invalid={Boolean(error)}
                  className="h-full w-full min-w-0 bg-transparent px-3 text-[0.98rem] text-cream outline-none"
                />
              </InputShell>
            </label>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-soft">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" loading={busy} className="mt-6 h-[54px] w-full rounded-[10px]" disabled={!isSupabaseConfigured}>
              Enviar link de recuperação
            </Button>
          </motion.form>
        )}

        {step === 'sent' && (
          <motion.div key="sent" {...fade} role="status">
            <span className="grid size-14 place-items-center rounded-2xl border border-mint/30 bg-mint/10 text-mint">
              <MailCheck className="size-6" aria-hidden />
            </span>
            <h1 className="mt-8 text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-cream">Confira seu e-mail.</h1>
            <p className="mt-2.5 leading-relaxed text-mist">
              Se <strong className="text-cream">{email}</strong> estiver cadastrado, você vai receber um link para criar uma nova senha. Veja também a
              caixa de spam.
            </p>
            <Button variant="secondary" size="lg" className="mt-8 h-[54px] w-full rounded-[10px]" onClick={() => setStep('email')}>
              Voltar para o login
            </Button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" {...fade} role="status">
            <span className="grid size-14 place-items-center rounded-2xl border border-mint/30 bg-mint/10 text-mint">
              <Check className="size-6" aria-hidden />
            </span>
            <p className="eyebrow mt-8 text-mint">Acesso liberado</p>
            <h1 className="mt-3 text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-cream">Tudo certo.</h1>
            <p className="mt-2.5 text-mist">Abrindo seu painel…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}

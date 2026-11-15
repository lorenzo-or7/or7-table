/**
 * Segundo fator obrigatório (TOTP / Authenticator) — Supabase Auth MFA.
 *  - Primeiro acesso: cadastra o Authenticator (QR Code ou chave manual) e confirma com um código.
 *  - Acessos seguintes: pede o código do Authenticator cadastrado.
 * O segredo TOTP só existe na memória desta tela enquanto ela está aberta: nunca vai para tabelas,
 * logs ou armazenamento do navegador. O acesso ao painel só é liberado com a sessão em aal2.
 */
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Copy, KeyRound, LifeBuoy, LogOut, ShieldCheck, Smartphone } from 'lucide-react'
import { AuthShell, StepProgress, type AuthStage } from '@/components/auth/AuthShell'
import { CodeInput } from '@/components/auth/CodeInput'
import { Button, Spinner } from '@/components/ui/primitives'
import { homeFor, useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { whatsappHref } from '@/lib/site'

type Enrollment = { factorId: string; qr: string; secret: string }

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
}

/**
 * O Supabase devolve o QR como 'data:image/svg+xml;utf-8,<svg…>'. Sem codificar, um '#' nas cores do SVG
 * corta a URL e a imagem não aparece: recodifica o SVG antes de exibir.
 */
function svgDataUri(qr: string) {
  const svg = qr.replace(/^data:image\/svg\+xml;[^,]*,/, '')
  return svg.trimStart().startsWith('<') ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : qr
}

/** Mensagem para o usuário, sem detalhes técnicos. */
function codeError(error: unknown) {
  const raw = error && typeof error === 'object' ? `${(error as { code?: string }).code ?? ''} ${(error as { message?: string }).message ?? ''}` : String(error)
  const msg = raw.toLowerCase()
  if (/rate|too many|429/.test(msg)) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
  if (/expired|expir/.test(msg)) return 'Este código já expirou. Use o código que aparece agora no aplicativo.'
  if (/invalid|incorrect|verification|code/.test(msg)) return 'Código incorreto. Confira se o horário do celular está automático e use o código atual.'
  if (/fetch|network/.test(msg)) return 'Sem conexão com o servidor. Verifique sua internet.'
  return 'Não foi possível verificar agora. Tente de novo em instantes.'
}

const logEvent = (event: 'mfa_enrolled' | 'mfa_challenge_failed' | 'mfa_verified') => {
  // registro de auditoria sem segredo; falha aqui nunca bloqueia o acesso
  supabase?.rpc('log_security_event', { p_event: event }).then(
    () => undefined,
    () => undefined,
  )
}

export default function MfaVerify() {
  const { session, loading, mfa, refreshMfa, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const reduce = useReducedMotion()
  const from = (location.state as { from?: string } | null)?.from
  const [step, setStep] = useState<'intro' | 'scan' | 'code' | 'done'>('intro')
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [help, setHelp] = useState(false)
  const verifying = useRef(false)
  // o modo é fixado na chegada: ao concluir, a sessão vira aal2 e a tela final não pode mudar de texto
  const mode = useRef<'enroll' | 'challenge' | null>(null)
  if (!mode.current && (mfa === 'enroll' || mfa === 'challenge')) mode.current = mfa
  const enrolling = mode.current === 'enroll'

  // desafio: descobre o fator TOTP verificado
  useEffect(() => {
    if (!supabase || mfa !== 'challenge') return
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const f = data?.totp?.[0]
      if (f) setFactorId(f.id)
      setStep('code')
    })
  }, [mfa])

  // o segredo não sobrevive a esta tela
  useEffect(() => () => setEnrollment(null), [])

  const sb = supabase
  if (!sb) return <Navigate to="/entrar" replace />
  if (!loading && !session) return <Navigate to="/entrar" replace />

  const finish = async () => {
    const level = await refreshMfa()
    if (level !== 'ok') {
      setError('A verificação não foi concluída. Tente o código novamente.')
      return
    }
    const profile = await refreshProfile()
    setStep('done')
    const home = homeFor(profile)
    window.setTimeout(() => navigate(from && profile && from.startsWith(home) ? from : home, { replace: true }), reduce ? 0 : 900)
  }

  const startEnroll = async () => {
    setBusy(true)
    setError(null)
    try {
      // cadastros abandonados (QR gerado e nunca confirmado) são descartados antes de gerar um novo
      const { data: list } = await sb.auth.mfa.listFactors()
      for (const f of list?.all ?? []) {
        if (f.factor_type === 'totp' && f.status !== 'verified') await sb.auth.mfa.unenroll({ factorId: f.id })
      }
      const { data, error: err } = await sb.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Or7 Table ${new Date().toISOString().slice(0, 16)}`,
        issuer: 'Or7 Table',
      })
      if (err || !data) throw err ?? new Error('enroll')
      setEnrollment({ factorId: data.id, qr: svgDataUri(data.totp.qr_code), secret: data.totp.secret })
      setFactorId(data.id)
      setStep('scan')
    } catch {
      setError('Não foi possível gerar o QR Code agora. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const verify = async (value = code) => {
    if (!factorId || verifying.current) return
    if (!/^\d{6}$/.test(value)) {
      setError('Digite os 6 números do aplicativo.')
      return
    }
    verifying.current = true
    setBusy(true)
    setError(null)
    try {
      const { data: challenge, error: cErr } = await sb.auth.mfa.challenge({ factorId })
      if (cErr || !challenge) throw cErr ?? new Error('challenge')
      const { error: vErr } = await sb.auth.mfa.verify({ factorId, challengeId: challenge.id, code: value })
      if (vErr) throw vErr
      logEvent(enrolling ? 'mfa_enrolled' : 'mfa_verified')
      setEnrollment(null)
      await finish()
    } catch (err) {
      logEvent('mfa_challenge_failed')
      setError(codeError(err))
      setCode('')
    } finally {
      verifying.current = false
      setBusy(false)
    }
  }

  const copySecret = async () => {
    if (!enrollment) return
    try {
      await navigator.clipboard.writeText(enrollment.secret)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* o usuário pode selecionar e copiar manualmente */
    }
  }

  const stage: AuthStage = step === 'done' ? 'granted' : error ? 'error' : step === 'code' || step === 'scan' ? 'identified' : 'idle'
  const labels = enrolling ? ['Aplicativo', 'QR Code', 'Código'] : ['Senha', 'Código']
  const progress = enrolling ? (step === 'intro' ? 0 : step === 'scan' ? 1 : 2) : 1

  return (
    <AuthShell
      stage={stage}
      eyebrow="Verificação em duas etapas"
      heading={enrolling ? 'Mais uma\ncamada de proteção.' : 'Confirme\nque é você.'}
      text="Todo acesso administrativo ao Or7 Table usa senha e um código do Authenticator. Assim, nenhuma senha vazada abre o seu painel."
    >
      {!loading && mfa === 'unavailable' ? (
        <div role="alert">
          <h1 className="text-[1.75rem] leading-tight font-semibold text-cream">Sem conexão com o servidor</h1>
          <p className="mt-2.5 leading-relaxed text-mist">Não conseguimos falar com o servidor de autenticação. Confira a internet e tente de novo.</p>
          <Button size="lg" className="mt-8 h-[54px] w-full rounded-[10px]" onClick={() => refreshMfa()}>
            Tentar de novo
          </Button>
        </div>
      ) : !loading && mfa === 'none' ? (
        <Navigate to="/entrar" replace />
      ) : loading ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : mfa === 'ok' && !busy && step !== 'done' ? (
        <Navigate to={from ?? '/entrar'} replace />
      ) : (
        <>
          {step !== 'done' && <StepProgress step={progress} labels={labels} />}
          <AnimatePresence mode="wait">
            {step === 'intro' && enrolling && (
              <motion.div key="intro" {...fade}>
                <p className="eyebrow text-gold">Primeiro acesso</p>
                <h1 className="mt-3 text-[2rem] leading-tight font-semibold text-cream">Ative o Authenticator.</h1>
                <p className="mt-2.5 leading-relaxed text-mist">
                  Instale um aplicativo autenticador no celular, como Google Authenticator, Microsoft Authenticator ou 1Password. Ele gera um código novo a cada 30 segundos.
                </p>
                <ul className="mt-6 grid gap-3 text-sm text-mist">
                  {[
                    [<Smartphone key="a" />, 'Abra o aplicativo no celular'],
                    [<KeyRound key="b" />, 'Leia o QR Code ou digite a chave'],
                    [<ShieldCheck key="c" />, 'Confirme com o código de 6 números'],
                  ].map(([icon, text], i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gold [&>svg]:size-4">{icon}</span>
                      {text}
                    </li>
                  ))}
                </ul>
                {error && (
                  <p role="alert" className="mt-5 text-sm text-red-soft">
                    {error}
                  </p>
                )}
                <Button size="lg" className="mt-8 h-[54px] w-full rounded-[10px]" onClick={startEnroll} loading={busy}>
                  Configurar agora
                </Button>
              </motion.div>
            )}

            {step === 'scan' && enrollment && (
              <motion.div key="scan" {...fade}>
                <h1 className="text-[1.75rem] leading-tight font-semibold text-cream">Leia o QR Code</h1>
                <p className="mt-2 text-sm leading-relaxed text-mist">No aplicativo, toque em adicionar conta e aponte a câmera para o código.</p>
                <div className="mt-6 flex flex-col items-center gap-5">
                  <div className="shrink-0 rounded-2xl bg-white p-3 shadow-[0_0_0_1px_rgb(255_170_0/0.25),0_20px_40px_-20px_rgb(0_0_0/0.6)]">
                    <img src={enrollment.qr} alt="QR Code para cadastrar o Or7 Table no aplicativo autenticador" width={176} height={176} className="block size-[176px]" />
                  </div>
                  <div className="w-full min-w-0">
                    <p className="text-sm font-medium text-cream/90">Sem câmera? Digite a chave manualmente</p>
                    <p className="mt-1 text-xs text-dim">Tipo: baseada em tempo. Conta: seu e-mail.</p>
                    <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-white/10 bg-navy-950/80 p-1.5 pl-3">
                      <code className="min-w-0 flex-1 font-[family-name:var(--font-ui)] text-[0.95rem] tracking-[0.12em] break-all text-cream select-all">
                        {enrollment.secret.match(/.{1,4}/g)?.join(' ')}
                      </code>
                      <Button size="sm" variant="secondary" onClick={copySecret} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
                        <span aria-live="polite">{copied ? 'Copiada' : 'Copiar'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <Button size="lg" className="mt-8 h-[54px] w-full rounded-[10px]" onClick={() => setStep('code')}>
                  Já adicionei, continuar
                </Button>
              </motion.div>
            )}

            {step === 'code' && (
              <motion.form
                key="code"
                {...fade}
                onSubmit={(e) => {
                  e.preventDefault()
                  verify()
                }}
                noValidate
              >
                <h1 className="text-[1.75rem] leading-tight font-semibold text-cream">{enrolling ? 'Digite o código' : 'Código do Authenticator'}</h1>
                <p id="mfa-hint" className="mt-2 text-sm leading-relaxed text-mist">
                  Abra o aplicativo e digite os 6 números exibidos para o Or7 Table. Você pode colar o código.
                </p>
                <div className="mt-7">
                  <CodeInput
                    value={code}
                    onChange={(v) => {
                      setCode(v)
                      setError(null)
                    }}
                    onComplete={(v) => verify(v)}
                    invalid={Boolean(error)}
                    disabled={busy || !factorId}
                    describedBy={error ? 'mfa-error' : 'mfa-hint'}
                    autoFocus
                  />
                </div>
                <div className="mt-3 min-h-6">
                  {error ? (
                    <p id="mfa-error" role="alert" className="text-sm text-red-soft">
                      {error}
                    </p>
                  ) : busy ? (
                    <p role="status" className="flex items-center gap-2 text-sm text-mist">
                      <Spinner className="size-4" /> Verificando…
                    </p>
                  ) : null}
                </div>
                <Button type="submit" size="lg" className="mt-4 h-[54px] w-full rounded-[10px]" loading={busy} disabled={code.length !== 6}>
                  Verificar e entrar
                </Button>
                {enrolling && (
                  <button type="button" onClick={() => setStep('scan')} className="mt-4 w-full rounded-md py-2 text-sm text-gold-soft hover:underline">
                    Voltar ao QR Code
                  </button>
                )}
              </motion.form>
            )}

            {step === 'done' && (
              <motion.div key="done" {...fade} role="status">
                <span className="grid size-14 place-items-center rounded-2xl border border-mint/30 bg-mint/10 text-mint">
                  <ShieldCheck className="size-6" aria-hidden />
                </span>
                <h1 className="mt-6 text-[2rem] leading-tight font-semibold text-cream">{enrolling ? 'Authenticator ativado.' : 'Verificado.'}</h1>
                <p className="mt-2.5 text-mist">Abrindo seu painel…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== 'done' && (
            <div className="mt-10 border-t border-white/[0.06] pt-6">
              <button
                type="button"
                aria-expanded={help}
                aria-controls="mfa-help"
                onClick={() => setHelp((v) => !v)}
                className="flex items-center gap-2 rounded-md text-sm text-mist hover:text-cream"
              >
                <LifeBuoy className="size-4 text-gold" aria-hidden /> Perdi o acesso ao aplicativo
              </button>
              {help && (
                <p id="mfa-help" className="mt-3 text-sm leading-relaxed text-dim">
                  Por segurança, a senha sozinha não libera o painel. Fale com a equipe Or7: depois de confirmar sua identidade, o Super Admin remove o Authenticator antigo e você cadastra um novo no próximo acesso.{' '}
                  <a href={whatsappHref('question')} target="_blank" rel="noreferrer" className="font-medium text-gold-soft underline underline-offset-4">
                    Falar no WhatsApp
                  </a>
                </p>
              )}
              <button
                type="button"
                onClick={async () => {
                  await signOut()
                  navigate('/entrar', { replace: true })
                }}
                className="mt-4 flex items-center gap-2 rounded-md text-sm text-mist hover:text-cream"
              >
                <LogOut className="size-4" aria-hidden /> Sair e usar outra conta
              </button>
            </div>
          )}
        </>
      )}
    </AuthShell>
  )
}

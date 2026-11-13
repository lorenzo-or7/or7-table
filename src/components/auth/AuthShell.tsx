/**
 * Moldura das telas de acesso — interpretação autoral da referência OrbitKey.
 * Um único painel emoldurado: à esquerda, o visual que reage à etapa
 * (aguardando → e-mail reconhecido → acesso liberado); à direita, o formulário.
 * Animações só com transform/opacity (CSS), sem filtros de blur.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/components/ui/primitives'

export type AuthStage = 'idle' | 'identified' | 'granted' | 'error'

const readout: Record<AuthStage, string> = {
  idle: 'Aguardando identificação',
  identified: 'E-mail reconhecido',
  granted: 'Acesso liberado',
  error: 'Verifique os dados',
}

const accentOf: Record<AuthStage, string> = {
  idle: '#FFAA00',
  identified: '#FFC64D',
  granted: '#4FD1A1',
  error: '#FF5468',
}

function Orbit({ stage }: { stage: AuthStage }) {
  const accent = accentOf[stage]
  const coreScale = stage === 'granted' ? 1.12 : stage === 'identified' ? 1.05 : 1
  return (
    <div aria-hidden className="auth-orbit pointer-events-none relative grid aspect-square w-full place-items-center">
      {/* brilho: gradiente radial, sem blur */}
      <div
        className="absolute inset-[8%] rounded-full transition-[background] duration-700"
        style={{ background: `radial-gradient(closest-side, ${accent}33, ${accent}10 55%, transparent 75%)` }}
      />
      <div className="auth-ring absolute inset-[6%] rounded-full border border-white/[0.09]" style={{ ['--tilt' as string]: '-26deg', animationDuration: '38s' }} />
      <div className="auth-ring absolute inset-[16%] rounded-full border border-gold/25" style={{ ['--tilt' as string]: '32deg', animationDuration: '30s', animationDirection: 'reverse' }} />
      <div
        className="auth-ring absolute inset-[27%] rounded-full border transition-colors duration-700"
        style={{ ['--tilt' as string]: '-58deg', animationDuration: '22s', borderColor: `${accent}88` }}
      />
      <span className="absolute top-1/2 left-[6%] h-px w-[88%] bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <span className="absolute top-[6%] left-1/2 h-[88%] w-px bg-gradient-to-b from-transparent via-white/12 to-transparent" />
      <span className="auth-blink absolute top-[19%] right-[24%] size-2 rounded-full bg-cream shadow-[0_0_12px_#FFC64D]" />
      <span className="absolute bottom-[27%] left-[18%] size-1.5 rounded-full bg-red shadow-[0_0_10px_#FF001E]" />

      <div className={cn('relative w-[30%] transition-transform duration-700 ease-[var(--ease-out-quint)]', stage === 'error' && 'auth-shake')} style={{ transform: `scale(${coreScale})` }}>
        <div
          className="absolute inset-[-22%] rounded-[34%] transition-[background] duration-700"
          style={{ background: `radial-gradient(closest-side, ${accent}55, transparent 72%)` }}
        />
        <Logo variant="icon" className="relative w-full" alt="" priority />
      </div>

      <div className="absolute bottom-[1%] left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-navy-950/80 px-3 py-1.5 font-[family-name:var(--font-ui)] text-[10px] font-medium tracking-[0.18em] whitespace-nowrap text-mist uppercase">
        <span className="size-1.5 rounded-full transition-colors duration-500" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        {readout[stage]}
      </div>
    </div>
  )
}

/** Curvas de nível em dourado — textura técnica do painel visual. */
function Contours() {
  return (
    <svg aria-hidden viewBox="0 0 700 700" preserveAspectRatio="none" className="pointer-events-none absolute right-[-6%] bottom-[-10%] h-[80%] w-[78%] opacity-40">
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M702 ${80 + i * 26}C${520 + i * 22} ${24 + i * 30} ${430 + i * 24} ${100 + i * 24} ${486 + i * 18} ${202 + i * 14}S${665 - i * 18} ${334} ${508 - i * 12} ${390 + i * 10} ${370 + i * 30} ${531 - i * 6} ${512 + i * 22} ${616 - i * 22} ${666 + i * 8} ${671 - i * 24} 702 ${698 - i * 26}`}
          fill="none"
          stroke="rgb(255 198 77 / 0.28)"
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}

export function AuthShell({
  stage,
  children,
  eyebrow = 'Acesso restrito',
  heading = 'Seu cardápio,\nsob controle.',
  text = 'Painel do Or7 Table para a equipe Or7 e para administradores de restaurante. Cada acesso é criado pela Or7.',
}: {
  stage: AuthStage
  children: ReactNode
  eyebrow?: string
  heading?: string
  text?: string
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-abyss sm:grid sm:place-items-center sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden opacity-60 [background-image:linear-gradient(rgb(255_255_255/0.025)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.025)_1px,transparent_1px)] [background-size:56px_56px] sm:block"
      />
      <div className="relative grid min-h-dvh w-full max-w-[1180px] overflow-hidden bg-navy-950 sm:min-h-[min(760px,calc(100dvh-3rem))] sm:rounded-[28px] sm:border sm:border-white/[0.08] sm:shadow-[0_40px_120px_-30px_rgb(0_0_0/0.85)] lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)]">
        {/* ------------------------------------------------ painel visual */}
        <section className="relative isolate flex flex-col overflow-hidden bg-[linear-gradient(140deg,#131a44_0%,#0d1230_52%,#0a0d24_100%)] px-6 pt-6 pb-7 sm:px-10 sm:pt-9 lg:pb-9">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(115deg,#000,transparent_78%)]"
          />
          <div aria-hidden className="absolute -bottom-40 -left-40 -z-10 size-[520px] bg-[radial-gradient(closest-side,rgb(255_0_30/0.12),transparent)]" />
          <Contours />

          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" aria-label="Voltar ao site do Or7 Table" className="rounded-md">
              <Logo variant="horizontal" className="h-8 w-auto sm:h-9" priority />
            </Link>
            <span className="hidden font-[family-name:var(--font-ui)] text-[10px] tracking-[0.2em] text-dim uppercase sm:block">
              Sistema de acesso <b className="ml-1.5 font-semibold text-gold">01</b>
            </span>
          </div>

          <div className="relative z-10 mx-auto my-4 w-[min(66vw,250px)] sm:w-[min(52%,300px)] lg:absolute lg:top-[7%] lg:right-[6%] lg:my-0 lg:w-[min(52%,360px,40dvh)]">
            <Orbit stage={stage} />
          </div>

          <div className="relative z-10 mt-auto max-w-md">
            <p className="eyebrow flex items-center gap-2.5 text-gold">
              <span className="h-px w-6 bg-current" aria-hidden />
              {eyebrow}
            </p>
            <h2 className="display mt-3 text-[2.6rem] whitespace-pre-line text-cream sm:mt-4 sm:text-6xl lg:text-[5.2rem]">{heading}</h2>
            <p className="mt-4 hidden max-w-sm text-[0.95rem] leading-relaxed text-mist sm:block">{text}</p>
          </div>

          <div className="relative z-10 mt-8 hidden items-center justify-between border-t border-white/[0.06] pt-5 font-[family-name:var(--font-ui)] text-[10px] tracking-[0.18em] text-dim uppercase lg:flex">
            <span>Privado por padrão</span>
            <span className="flex items-center gap-2">
              <i className="size-1 rounded-full bg-gold" />
              Or7.dev
            </span>
          </div>
        </section>

        {/* ------------------------------------------------ formulário */}
        <section className="relative flex flex-col bg-navy-900 px-6 pt-6 pb-6 sm:px-12 lg:px-14">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 rounded-md py-1 pr-2 text-sm text-mist transition-colors hover:text-cream">
              <ArrowLeft className="size-4" aria-hidden /> Voltar ao site
            </Link>
            <span className="inline-flex items-center gap-2 font-[family-name:var(--font-ui)] text-[10px] tracking-[0.16em] text-dim uppercase">
              <i className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_#4FD1A1]" /> Painel seguro
            </span>
          </div>
          <div className="mx-auto my-auto w-full max-w-[392px] py-10">{children}</div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-5 font-[family-name:var(--font-ui)] text-[10px] tracking-[0.14em] text-dim uppercase">
            <span>
              Or7 Table <b className="font-semibold text-mist">v1</b>
            </span>
            <span>Sessão criptografada</span>
          </div>
        </section>
      </div>
    </main>
  )
}

export function StepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="mb-9 flex items-center gap-3 font-[family-name:var(--font-ui)] text-[11px] font-medium tracking-[0.06em]" aria-label={`Etapa ${step + 1} de ${labels.length}`}>
      {labels.map((label, i) => (
        <li key={label} className="flex items-center gap-3">
          {i > 0 && (
            <span aria-hidden className="relative h-px w-10 overflow-hidden bg-white/12">
              <span className={cn('absolute inset-0 origin-left bg-gold transition-transform duration-500', i <= step ? 'scale-x-100' : 'scale-x-0')} />
            </span>
          )}
          <span className={cn('flex items-center gap-1.5 whitespace-nowrap transition-colors', i <= step ? 'text-cream' : 'text-dim')} aria-current={i === step ? 'step' : undefined}>
            <b className={cn('font-semibold', i <= step ? 'text-gold' : 'text-dim')}>{String(i + 1).padStart(2, '0')}</b>
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Aviso quando o login ainda não está disponível. Em produção, o visitante vê
 * só uma mensagem amigável; detalhes técnicos aparecem apenas em desenvolvimento.
 */
export function ConfigNotice() {
  return (
    <div role="status" className="mb-7 rounded-[12px] border border-gold/25 bg-gold/[0.06] p-4 text-sm leading-relaxed">
      <p className="font-semibold text-gold-soft">O acesso ao painel está temporariamente indisponível.</p>
      <p className="mt-1 text-mist">Tente novamente em alguns minutos. Se precisar de ajuda, fale com a equipe Or7.</p>
      {import.meta.env.DEV && (
        <p className="mt-3 border-t border-gold/15 pt-3 font-[family-name:var(--font-ui)] text-xs text-gold-soft/80">
          Desenvolvimento: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local e reinicie o servidor.
        </p>
      )}
    </div>
  )
}

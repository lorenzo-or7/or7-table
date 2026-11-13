import { assetUrl, appPath } from '@/lib/site'
/**
 * Tela de carregamento oficial do Or7 Table (somente no shell: login e painéis).
 * A logo é o arquivo aprovado (or7table-stacked.webp): o símbolo e o wordmark são o MESMO arquivo,
 * revelados em duas etapas por recorte (clip-path), sem redesenho.
 * A barra mostra o progresso real das etapas de lib/boot.ts; enquanto uma etapa não termina,
 * um brilho percorre a barra (indeterminado), sem inventar porcentagem.
 */
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { BOOT_LABELS, useBoot } from '@/lib/boot'

const BG = '#0F1432'
const RED = '#FF001E'
const GOLD = '#FFAA00'
const ease = [0.22, 1, 0.36, 1] as const

export function BootScreen() {
  const boot = useBoot()
  const reduce = useReducedMotion()
  const [slow, setSlow] = useState(false)
  const pct = Math.round((boot.done.filter((s) => boot.needed.includes(s)).length / boot.needed.length) * 100)
  const current = boot.needed.find((s) => !boot.done.includes(s))

  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 12000)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden px-6"
      style={{ background: BG }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduce ? 0.15 : 0.55, ease } }}
    >
      {/* geometria discreta: ecos do quadrado do símbolo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <motion.span
          className="absolute size-[min(120vw,620px)] rotate-45 rounded-[22%] border"
          style={{ borderColor: 'rgba(255,170,0,.07)' }}
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease }}
        />
        <motion.span
          className="absolute size-[min(84vw,420px)] rotate-45 rounded-[22%] border"
          style={{ borderColor: 'rgba(255,255,255,.05)' }}
          initial={reduce ? false : { opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.1, ease }}
        />
        <span className="absolute size-[460px] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(255,170,0,.10), rgba(255,0,30,.04) 55%, transparent)' }} />
      </div>

      <div className="relative flex w-full max-w-[300px] flex-col items-center">
        <div className="relative w-[min(240px,62vw)]" style={{ aspectRatio: '640 / 383' }}>
          <h1 className="sr-only">Or7 Table</h1>
          {/* 1. símbolo */}
          <motion.img
            src={assetUrl('/brand/or7table-stacked.webp')}
            width={640}
            height={383}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
            style={{ clipPath: 'inset(0 0 45% 0)' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
          />
          {/* 2. wordmark */}
          <motion.img
            src={assetUrl('/brand/or7table-stacked.webp')}
            width={640}
            height={383}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
            initial={reduce ? { opacity: 0, clipPath: 'inset(56% 0% 0 0)' } : { opacity: 0, clipPath: 'inset(56% 100% 0 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(56% 0% 0 0)' }}
            transition={{ duration: 0.9, delay: 0.45, ease }}
          />
        </div>

        {boot.error ? (
          <div role="alert" className="mt-10 text-center">
            <p className="text-[15px] font-medium text-cream">Não foi possível abrir o Or7 Table.</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">{boot.error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1432]">
                Tentar novamente
              </button>
              <a href={appPath('/')} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-cream outline-none focus-visible:ring-2 focus-visible:ring-gold">
                Ir para o site
              </a>
            </div>
          </div>
        ) : (
          <motion.div className="mt-10 w-full" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7, ease }}>
            <div className="flex items-baseline justify-between text-[12px]">
              <span aria-live="polite" className="text-mist">
                {current ? BOOT_LABELS[current] : 'Pronto'}
              </span>
              <span className="font-semibold tabular-nums" style={{ color: GOLD }}>
                {pct}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Carregando o Or7 Table"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="relative mt-2.5 h-[3px] overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,.08)' }}
            >
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `linear-gradient(90deg, ${RED}, ${GOLD})`, boxShadow: '0 0 12px rgba(255,170,0,.45)' }}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(pct, 4)}%` }}
                transition={{ duration: reduce ? 0 : 0.5, ease }}
              />
              {/* atividade enquanto a etapa atual não termina (sem inventar porcentagem) */}
              {!reduce && current && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 w-1/4"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)' }}
                  animate={{ left: ['-25%', '100%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>
            {slow && (
              <p className="mt-5 text-center text-[13px] leading-relaxed text-mist">
                Está demorando mais que o normal.{' '}
                <button type="button" onClick={() => window.location.reload()} className="font-semibold text-gold underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-gold">
                  Recarregar
                </button>
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

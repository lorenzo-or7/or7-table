/**
 * Gráficos discretos do painel. Paleta validada (dataviz validate_palette,
 * modo escuro, superfície #0B1029): QR #B87A00 · Link #5B83D6.
 */
import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/components/ui/primitives'

export const SERIES = { qr: '#B87A00', link: '#5B83D6', highlight: '#FFAA00' }

export interface DayPoint {
  day: string // yyyy-mm-dd
  qr: number
  link: number
}

const dayFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const longFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' })

/** Colunas empilhadas QR + link por dia, com tooltip e tabela acessível. */
export function ViewsChart({ data, height = 220, className }: { data: DayPoint[]; height?: number; className?: string }) {
  const reduce = useReducedMotion()
  const [hover, setHover] = useState<number | null>(null)
  const id = useId()
  const max = Math.max(1, ...data.map((d) => d.qr + d.link))
  const nice = niceMax(max)
  const ticks = [0, nice / 2, nice]
  const total = data.reduce((a, d) => a + d.qr + d.link, 0)
  const labelEvery = data.length > 20 ? 7 : data.length > 10 ? 3 : 1

  return (
    <figure className={cn('relative', className)} aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="sr-only">
        Visualizações por dia, total {total}
      </figcaption>
      <div className="flex gap-3">
        <div className="relative w-7 shrink-0 text-right text-[11px] text-dim tabular" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / nice) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <div key={t} aria-hidden className="absolute inset-x-0 border-t border-white/[0.05]" style={{ top: `${(1 - t / nice) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" aria-hidden>
            {data.map((d, i) => {
              const qrH = (d.qr / nice) * 100
              const linkH = (d.link / nice) * 100
              const active = hover === i
              return (
                <div key={d.day} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)}>
                  {/* alvo de hover maior que a barra */}
                  <div className={cn('absolute inset-x-[-1px] inset-y-0 rounded-md transition-colors', active && 'bg-white/[0.04]')} />
                  <motion.div
                    className="relative flex flex-col justify-end gap-[2px]"
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: `${qrH + linkH}%` }}
                    transition={{ duration: 0.7, delay: reduce ? 0 : i * 0.015, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {d.link > 0 && (
                      <div className="w-full rounded-t-[4px]" style={{ flex: d.link, background: SERIES.link, opacity: hover === null || active ? 1 : 0.55 }} />
                    )}
                    {d.qr > 0 && (
                      <div
                        className={cn('w-full', d.link > 0 ? '' : 'rounded-t-[4px]')}
                        style={{ flex: d.qr, background: SERIES.qr, opacity: hover === null || active ? 1 : 0.55 }}
                      />
                    )}
                  </motion.div>
                </div>
              )
            })}
          </div>
          {hover !== null && data[hover] && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-white/10 bg-navy-800/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%`, top: 4 }}
            >
              <p className="font-medium whitespace-nowrap text-cream">{longFmt.format(new Date(data[hover].day))}</p>
              <p className="mt-1 flex items-center gap-2 whitespace-nowrap text-mist">
                <i className="size-2 rounded-sm" style={{ background: SERIES.qr }} /> QR Code <b className="ml-auto pl-3 text-cream tabular">{data[hover].qr}</b>
              </p>
              <p className="flex items-center gap-2 whitespace-nowrap text-mist">
                <i className="size-2 rounded-sm" style={{ background: SERIES.link }} /> Link direto <b className="ml-auto pl-3 text-cream tabular">{data[hover].link}</b>
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 ml-10 flex text-[11px] text-dim" aria-hidden>
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center whitespace-nowrap">
            {i % labelEvery === 0 ? dayFmt.format(new Date(d.day)) : ''}
          </span>
        ))}
      </div>
      <Legend className="mt-4 ml-10" />
      <table className="sr-only">
        <caption>Visualizações por dia</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>QR Code</th>
            <th>Link direto</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{longFmt.format(new Date(d.day))}</td>
              <td>{d.qr}</td>
              <td>{d.link}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export function Legend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4 text-xs text-mist', className)}>
      <span className="flex items-center gap-1.5">
        <i className="size-2.5 rounded-sm" style={{ background: SERIES.qr }} aria-hidden /> QR Code
      </span>
      <span className="flex items-center gap-1.5">
        <i className="size-2.5 rounded-sm" style={{ background: SERIES.link }} aria-hidden /> Link direto
      </span>
    </div>
  )
}

/** Proporção entre duas origens, com rótulos diretos (não depende só da cor). */
export function SourceSplit({ qr, link }: { qr: number; link: number }) {
  const reduce = useReducedMotion()
  const total = qr + link
  const pq = total ? Math.round((qr / total) * 100) : 0
  const pl = total ? 100 - pq : 0
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-white/[0.05]" role="img" aria-label={`QR Code ${pq}%, link direto ${pl}%`}>
        {total > 0 && (
          <>
            <motion.div className="h-full rounded-l-full" style={{ background: SERIES.qr }} initial={reduce ? false : { width: 0 }} animate={{ width: `${pq}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
            <motion.div className="h-full rounded-r-full" style={{ background: SERIES.link }} initial={reduce ? false : { width: 0 }} animate={{ width: `${pl}%` }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} />
          </>
        )}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        {[
          { label: 'QR Code', value: qr, pct: pq, color: SERIES.qr },
          { label: 'Link direto', value: link, pct: pl, color: SERIES.link },
        ].map((s) => (
          <div key={s.label}>
            <dt className="flex items-center gap-1.5 text-xs text-mist">
              <i className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden /> {s.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-cream tabular">
              {s.value.toLocaleString('pt-BR')} <span className="text-sm font-normal text-dim">{s.pct}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Mini tendência para cards de indicador. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null
  const max = Math.max(1, ...values)
  const w = 100
  const h = 28
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn('h-7 w-full', className)} aria-hidden>
      <polyline points={pts} fill="none" stroke={SERIES.highlight} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function niceMax(n: number) {
  if (n <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(n))
  const steps = [1, 2, 2.5, 5, 10]
  for (const s of steps) if (s * pow >= n) return s * pow
  return 10 * pow
}

/** Preenche dias sem visitas com zero, em UTC, para o eixo ficar contínuo. */
export function fillDays(rows: { day: string; source: 'qr' | 'link'; views: number }[], days: number): DayPoint[] {
  const map = new Map<string, DayPoint>()
  const today = new Date()
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base - i * 86400000).toISOString().slice(0, 10)
    map.set(d, { day: d, qr: 0, link: 0 })
  }
  for (const r of rows) {
    const p = map.get(String(r.day).slice(0, 10))
    if (p) p[r.source] += r.views
  }
  return [...map.values()]
}

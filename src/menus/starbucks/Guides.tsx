/**
 * Guias editoriais do Starbucks Demo.
 *  - SizeGuide: infográfico dos copos Tall / Grande / Venti, com régua de volume (referências desta demo).
 *  - CoffeeAnatomy: "Mais leite ou mais café?" — camadas de quatro bebidas e a balança café × leite.
 * Ilustrações próprias em SVG; a sirene é o arquivo oficial (public/demo/starbucks/brand).
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { display, label, sb, SIREN, wrapClass } from './tokens'

/* ============================================================== copos */

export const SIZE_GUIDE = [
  { label: 'Tall', ml: 300, scale: 0.76, note: 'Para um café rápido' },
  { label: 'Grande', ml: 400, scale: 0.88, note: 'O meio-termo da casa' },
  { label: 'Venti', ml: 500, scale: 1, note: 'Para a tarde inteira' },
] as const

/** Copo gelado transparente, com gelo, condensação, canudo verde e a sirene oficial. */
export function ColdCup({ height, className }: { height: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const body = 'M8 22 L20 170 Q21 175 26 175 L74 175 Q79 175 80 170 L92 22 Z'
  return (
    <svg viewBox="0 0 100 184" height={height} width={(height * 100) / 184} className={className} aria-hidden>
      <defs>
        <linearGradient id={`l${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7a4a2a" />
          <stop offset="0.28" stopColor="#a8754b" />
          <stop offset="0.55" stopColor="#d2ad84" />
          <stop offset="0.8" stopColor="#efe3d1" />
          <stop offset="1" stopColor="#f6efe4" />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.94" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <ellipse cx="50" cy="178" rx="36" ry="3.6" fill="rgba(30,57,50,.16)" />
      <path d="M60 0 L55 60" stroke={sb.green} strokeWidth="5" strokeLinecap="round" />
      <g clipPath={`url(#c${id})`}>
        <rect x="0" y="22" width="100" height="160" fill="rgba(255,255,255,.35)" />
        <rect x="0" y="34" width="100" height="150" fill={`url(#l${id})`} />
        <path d="M0 92 C 22 82, 36 104, 58 94 S 90 88, 100 96 L100 120 C 80 112, 62 126, 40 116 S 12 118, 0 124 Z" fill="#8f5d38" opacity="0.32" />
        {[
          [22, 30, -12],
          [48, 28, 8],
          [70, 34, -6],
          [34, 52, 14],
          [60, 56, -14],
        ].map(([x, y, r], i) => (
          <rect key={i} x={x} y={y} width="17" height="15" rx="3.5" transform={`rotate(${r} ${x! + 8} ${y! + 7})`} fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.6)" strokeWidth="0.9" />
        ))}
        <rect x="0" y="22" width="100" height="160" fill={`url(#g${id})`} />
        {[
          [18, 130, 1.1],
          [24, 146, 0.8],
          [82, 120, 1],
          [76, 150, 0.9],
          [30, 74, 0.7],
          [84, 70, 0.8],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,.75)" />
        ))}
      </g>
      <path d={body} fill="none" stroke="rgba(30,57,50,.28)" strokeWidth="0.8" />
      <rect x="4" y="16" width="92" height="8" rx="3" fill="rgba(255,255,255,.7)" stroke="rgba(30,57,50,.3)" strokeWidth="0.8" />
      <circle cx="50" cy="104" r="15.5" fill="#fff" />
      <image href={SIREN} x="35.5" y="89.5" width="29" height="29" />
    </svg>
  )
}

/** Fração da altura do SVG entre a base e a tampa (a régua passa na tampa). */
const LID = (184 - 16) / 184

export function SizeGuide({ id }: { id?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const reduce = useReducedMotion()
  return (
    <section id={id} aria-labelledby="sb-size-title" className={`${wrapClass()} scroll-mt-32 pt-24 lg:pt-36`}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-span-4">
          <p className="text-[12px]" style={{ ...label, color: sb.accent }}>
            Guia de tamanhos
          </p>
          <h2 id="sb-size-title" className="mt-4 text-[clamp(44px,5.4vw,80px)] leading-[0.92]" style={{ ...display(), color: sb.house, letterSpacing: '-0.035em' }}>
            Três copos, <em style={{ color: sb.green }}>uma escolha.</em>
          </h2>
          <p className="mt-6 max-w-[38ch] text-[16px] leading-relaxed" style={{ color: sb.muted }}>
            A mesma bebida em três medidas. Os volumes são referências deste protótipo e nem toda bebida existe nos três tamanhos.
          </p>
        </div>

        <div className="lg:col-span-8 lg:col-start-5">
          {/* --size-h: altura do maior copo; régua e copos usam a mesma escala */}
          <ol aria-label="Tamanhos disponíveis" className="relative grid grid-cols-3 gap-2 [--size-h:190px] sm:gap-6 sm:[--size-h:270px] lg:[--size-h:320px]" onMouseLeave={() => setHover(null)}>
            {/* régua: uma linha tracejada na altura da tampa de cada copo */}
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0" style={{ height: 'calc(var(--size-h) + 24px)' }}>
              {SIZE_GUIDE.map((s, i) => (
                <span
                  key={s.label}
                  className="absolute inset-x-0 border-t border-dashed transition-[opacity,border-color] duration-500"
                  style={{
                    bottom: `calc(var(--size-h) * ${(s.scale * LID).toFixed(4)})`,
                    borderColor: hover === i ? sb.green : 'rgba(30,57,50,.22)',
                    opacity: hover === null || hover === i ? 1 : 0.35,
                  }}
                >
                  <span className="absolute -top-[9px] left-0 pr-2 text-[11px] tabular-nums" style={{ ...label, letterSpacing: '0.08em', background: sb.cream, color: hover === i ? sb.green : '#8f897e' }}>
                    {s.ml}
                  </span>
                </span>
              ))}
            </span>
            {SIZE_GUIDE.map((s, i) => (
              <li
                key={s.label}
                className="relative flex flex-col items-center text-center transition-opacity duration-500"
                style={{ opacity: hover === null || hover === i ? 1 : 0.55 }}
                onMouseEnter={() => setHover(i)}
              >
                <span className="flex items-end justify-center pt-6" style={{ height: 'calc(var(--size-h) + 24px)' }}>
                  <motion.span
                    className="block"
                    style={{ height: `calc(var(--size-h) * ${s.scale})` }}
                    animate={{ y: hover === i && !reduce ? -8 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  >
                    <ColdCup height={320} className="h-full w-auto" />
                  </motion.span>
                </span>
                <span className="mt-0 h-px w-full" style={{ background: sb.house }} aria-hidden />
                <span className="mt-5 text-[30px] leading-none sm:text-[44px]" style={{ ...display(), color: sb.house }}>
                  <em>{s.label}</em>
                </span>
                <span className="mt-2 text-[13px] tabular-nums sm:text-[14px]" style={{ ...label, letterSpacing: '0.1em', color: sb.green }}>
                  {s.ml} ml
                </span>
                <span className="mt-1.5 hidden text-[14px] sm:block" style={{ color: sb.muted }}>
                  {s.note}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[12.5px]" style={{ color: '#857e73' }}>
            Volumes de referência para esta demonstração. Copos em escala aproximada.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ============================================================== anatomia */

type LayerKey = 'espresso' | 'agua' | 'leite' | 'espuma' | 'crema'
const LAYER_ORDER: LayerKey[] = ['espresso', 'agua', 'leite', 'espuma', 'crema']
const LAYER: Record<LayerKey, { name: string; fill: string; side: 'cafe' | 'leite' }> = {
  espresso: { name: 'Espresso', fill: '#3b2317', side: 'cafe' },
  agua: { name: 'Água quente', fill: '#6e4630', side: 'cafe' },
  leite: { name: 'Leite vaporizado', fill: '#eadbc6', side: 'leite' },
  espuma: { name: 'Espuma de leite', fill: '#fbf7f0', side: 'leite' },
  crema: { name: 'Crema', fill: '#b57a45', side: 'cafe' },
}

/** Alturas relativas, em % do copo. Ilustrativas: não são receitas oficiais. */
const DRINKS: Array<{ key: string; name: string; character: string; note: string; layers: Partial<Record<LayerKey, number>> }> = [
  { key: 'espresso', name: 'Espresso', character: 'Intenso', note: 'Só café: curto, encorpado, com uma camada de crema.', layers: { espresso: 24, crema: 5 } },
  { key: 'americano', name: 'Americano', character: 'Longo e encorpado', note: 'Espresso alongado com água quente. Mais volume, o mesmo café.', layers: { espresso: 18, agua: 50, crema: 3 } },
  { key: 'cappuccino', name: 'Cappuccino', character: 'Equilibrado', note: 'Espresso, leite vaporizado e uma espuma alta e aerada.', layers: { espresso: 20, leite: 30, espuma: 30 } },
  { key: 'latte', name: 'Caffè Latte', character: 'Suave e cremoso', note: 'Mais leite, espuma fina. O café aparece com delicadeza.', layers: { espresso: 16, leite: 56, espuma: 8 } },
]

const GLASS = { top: 34, bottom: 222, left: 46, right: 154 }
const INNER = GLASS.bottom - 10 - GLASS.top - 6

export function CoffeeAnatomy() {
  const [active, setActive] = useState(3)
  const reduce = useReducedMotion()
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const uid = useId().replace(/:/g, '')
  const drink = DRINKS[active]!

  let cursor = GLASS.bottom - 10
  const stack = LAYER_ORDER.map((k) => {
    const h = ((drink.layers[k] ?? 0) / 100) * INNER
    cursor -= h
    return { k, y: cursor, h }
  })
  const labelled = stack.filter((l) => l.h > 0)
  const total = labelled.reduce((n, l) => n + l.h, 0)
  const milk = Math.round((labelled.filter((l) => LAYER[l.k].side === 'leite').reduce((n, l) => n + l.h, 0) / total) * 100)
  const coffee = 100 - milk

  // no celular as bebidas rolam na horizontal: mantém a ativa à vista (sem rolar a página)
  useEffect(() => {
    const tab = tabs.current[active]
    const bar = tab?.parentElement
    if (tab && bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: tab.offsetLeft - bar.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' })
  }, [active, reduce])

  const onKey = (e: KeyboardEvent) => {
    let next = active
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (active + 1) % DRINKS.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (active - 1 + DRINKS.length) % DRINKS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = DRINKS.length - 1
    else return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  const t = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 110, damping: 19, mass: 0.9 }

  return (
    <section aria-labelledby="sb-anatomy-title" className={`${wrapClass()} pt-24 lg:pt-36`}>
      <div className="rounded-[36px] px-5 py-12 sm:px-10 lg:px-12 lg:py-16" style={{ background: '#E9E1D3' }}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-6">
          <div className="min-w-0 lg:col-span-4">
            <p className="text-[12px]" style={{ ...label, color: sb.brown }}>
              Anatomia do café
            </p>
            <h2 id="sb-anatomy-title" className="mt-4 text-[clamp(42px,4.8vw,72px)] leading-[0.92]" style={{ ...display(), color: sb.house, letterSpacing: '-0.035em' }}>
              Mais leite ou <em style={{ color: sb.brown }}>mais café?</em>
            </h2>
            <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed" style={{ color: '#5a4c40' }}>
              Escolha uma bebida e veja o que vai na xícara, de baixo para cima.
            </p>

            <div
              role="tablist"
              aria-label="Bebidas"
              onKeyDown={onKey}
              className="no-scrollbar -mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:gap-0 lg:overflow-visible lg:px-0"
            >
              {DRINKS.map((d, i) => {
                const on = i === active
                return (
                  <button
                    key={d.key}
                    ref={(el) => {
                      tabs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${d.key}`}
                    aria-selected={on}
                    aria-controls={`${uid}-panel`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    data-active={on || undefined}
                    className="group flex min-h-11 shrink-0 items-center gap-3 rounded-full bg-white/55 px-4 text-left text-[#1E3932] transition-colors duration-300 outline-none hover:text-[#00754A] focus-visible:ring-2 focus-visible:ring-[#00754A] data-[active]:bg-[#1E3932] data-[active]:text-[#F2F0EB] lg:rounded-none lg:border-b lg:bg-transparent lg:px-0 lg:py-3.5 lg:first:border-t lg:data-[active]:bg-transparent lg:data-[active]:text-[#1E3932]"
                    style={{ borderColor: 'rgba(92,64,51,.2)' }}
                  >
                    <span className="hidden w-6 text-[11px] tabular-nums lg:inline" style={{ ...label, color: on ? sb.green : 'rgba(92,64,51,.5)' }}>
                      0{i + 1}
                    </span>
                    <span className="text-[16px] whitespace-nowrap transition-[font-size] lg:text-[28px]" style={{ ...display(), fontStyle: on ? 'italic' : 'normal' }}>
                      {d.name}
                    </span>
                    <motion.span aria-hidden className="ml-auto hidden h-px lg:block" style={{ background: sb.green }} initial={false} animate={{ width: on ? 48 : 0, opacity: on ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.5 }} />
                  </button>
                )
              })}
            </div>
          </div>

          <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${drink.key}`} className="grid min-w-0 items-center gap-8 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:col-span-8 lg:gap-10">
            <svg viewBox="22 14 300 228" className="mx-auto h-auto w-full max-w-[520px]" role="img" aria-label={`${drink.name}: ${labelled.map((l) => LAYER[l.k].name).join(', ')}`}>
              <defs>
                <clipPath id={`${uid}-in`}>
                  <path d={`M${GLASS.left + 5} ${GLASS.top} L${GLASS.left + 15} ${GLASS.bottom - 10} L${GLASS.right - 15} ${GLASS.bottom - 10} L${GLASS.right - 5} ${GLASS.top} Z`} />
                </clipPath>
                <linearGradient id={`${uid}-shine`} x1="0" x2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity=".5" />
                  <stop offset=".18" stopColor="#fff" stopOpacity="0" />
                  <stop offset=".86" stopColor="#fff" stopOpacity="0" />
                  <stop offset="1" stopColor="#fff" stopOpacity=".32" />
                </linearGradient>
                <pattern id={`${uid}-foam`} width="10" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="1.4" fill="#e7dccb" />
                  <circle cx="8" cy="6" r="0.9" fill="#ece3d4" />
                </pattern>
              </defs>
              <ellipse cx="100" cy={GLASS.bottom + 6} rx="66" ry="5" fill="rgba(60,40,28,.14)" />
              <g clipPath={`url(#${uid}-in)`}>
                <rect x="0" y="0" width="300" height="250" fill="rgba(255,255,255,.4)" />
                {stack.map((l) => (
                  <motion.g key={l.k} initial={false} animate={{ y: l.y }} transition={t}>
                    <motion.rect x="0" y="0" width="300" initial={false} animate={{ height: Math.max(l.h, 0.001) }} transition={t} fill={LAYER[l.k].fill} />
                    {l.k === 'espuma' && <motion.rect x="0" y="0" width="300" initial={false} animate={{ height: Math.max(l.h, 0.001) }} transition={t} fill={`url(#${uid}-foam)`} />}
                  </motion.g>
                ))}
                <rect x="0" y="0" width="300" height="250" fill={`url(#${uid}-shine)`} />
              </g>
              <path d={`M${GLASS.left} ${GLASS.top - 6} L${GLASS.left + 12} ${GLASS.bottom} L${GLASS.right - 12} ${GLASS.bottom} L${GLASS.right} ${GLASS.top - 6}`} fill="none" stroke="rgba(30,57,50,.4)" strokeWidth="1.6" strokeLinejoin="round" />
              <path d={`M${GLASS.left + 15} ${GLASS.bottom - 10} L${GLASS.right - 15} ${GLASS.bottom - 10}`} stroke="rgba(30,57,50,.2)" strokeWidth="1" />
              {labelled.map((l) => (
                <motion.g key={l.k} initial={false} animate={{ y: l.y + l.h / 2 }} transition={t}>
                  <line x1={GLASS.right - 8} x2="194" y1="0" y2="0" stroke={sb.house} strokeOpacity=".45" strokeWidth=".8" />
                  <circle cx={GLASS.right - 8} cy="0" r="2" fill={sb.house} />
                  <text x="200" y="4" fontSize="12.5" fill={sb.house} style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 600 }}>
                    {LAYER[l.k].name}
                  </text>
                </motion.g>
              ))}
            </svg>

            <div aria-live="polite" className="min-w-0">
              <p className="text-[12px]" style={{ ...label, color: sb.green }}>
                {drink.character}
              </p>
              <p className="mt-2 text-[clamp(34px,3.4vw,48px)] leading-none" style={{ ...display(), color: sb.house }}>
                <em>{drink.name}</em>
              </p>
              <p className="mt-3 text-[16px] leading-relaxed" style={{ color: '#5a4c40' }}>
                {drink.note}
              </p>

              {/* balança café × leite */}
              <div className="mt-8" role="img" aria-label={`${coffee}% café e ${milk}% leite, em proporção ilustrativa`}>
                <div className="flex items-end justify-between tabular-nums" style={{ color: sb.house }}>
                  <span>
                    <span className="block text-[10.5px]" style={{ ...label, color: sb.brown }}>
                      Café
                    </span>
                    <span className="text-[30px] leading-none" style={display()}>
                      {coffee}%
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[10.5px]" style={{ ...label, color: sb.brown }}>
                      Leite
                    </span>
                    <span className="text-[30px] leading-none" style={display()}>
                      {milk}%
                    </span>
                  </span>
                </div>
                <div className="relative mt-3 h-[3px] rounded-full" style={{ background: '#f6efe4' }}>
                  <motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ background: '#3b2317' }} initial={false} animate={{ width: `${coffee}%` }} transition={t} />
                  <motion.span
                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{ background: sb.cream, borderColor: '#3b2317' }}
                    initial={false}
                    animate={{ left: `${coffee}%` }}
                    transition={t}
                  />
                </div>
              </div>
              <p className="mt-6 text-[12px] leading-relaxed" style={{ color: '#7d6c5d' }}>
                Proporções ilustrativas, para comparar as bebidas. Não são receitas oficiais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

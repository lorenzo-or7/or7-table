import { assetUrl } from '@/lib/site'
import { productImage } from '@/lib/public-menu'
/**
 * Abertura compacta "Premium Digital Menu".
 * A fotografia do Iced Caramelo Macchiato tem fundo verde: no desktop ela ocupa a metade esquerda e se
 * dissolve no verde da casa, e o título entra por cima dessa transição. A altura é contida (nunca tela
 * cheia) para os produtos aparecerem logo abaixo. No celular a foto vem primeiro, mais baixa, e o
 * título sobe sobre ela. As categorias ficam na faixa logo abaixo da abertura e na navbar.
 */
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import type { PublicProduct } from '@/lib/public-menu'
import { formatBRL } from '@/lib/format'
import { display, ease, label, sb, SIREN, wrapClass } from './tokens'

const LEAD_IMG = assetUrl('/demo/starbucks/iced-caramelo-macchiato.webp')

export function Hero({
  total,
  lead,
  leadNumber,
  animate,
  parallax,
  embedded,
  showDemo,
  onStart,
  onOpen,
}: {
  total: number
  lead?: PublicProduct
  leadNumber?: number
  animate: boolean
  parallax: boolean
  embedded?: boolean
  showDemo: boolean
  onStart: () => void
  onOpen: (p: PublicProduct) => void
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 70])
  const leadSrc = productImage(lead?.image_path ?? null, 1400) ?? LEAD_IMG
  const minPrice = lead ? Math.min(lead.price, ...(lead.variants ?? []).map((v) => v.price)) : 0

  const line = (text: React.ReactNode, i: number) => (
    <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
      <motion.span className="block" initial={animate ? { y: '108%' } : false} animate={{ y: '0%' }} transition={{ duration: 1, delay: 0.1 + i * 0.08, ease }}>
        {text}
      </motion.span>
    </span>
  )

  const fadeUp = (delay: number) => (animate ? { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease } } : {})

  const headline = (size: string) => (
    <h1 className={size} style={{ ...display(), color: sb.cream, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 0.88 }}>
      <span className="sr-only">Starbucks: cardápio de cafés, Frappuccinos e comidas. </span>
      <span aria-hidden>
        {line('Café, gelo', 0)}
        {line(
          <>
            &amp; <em style={{ color: sb.mint, fontWeight: 400 }}>caramelo.</em>
          </>,
          1,
        )}
      </span>
    </h1>
  )

  const intro = (
    <motion.p {...fadeUp(0.35)} className="max-w-[38ch] text-[15.5px] leading-relaxed sm:text-[17px]" style={{ color: 'rgba(242,240,235,.8)' }}>
      {total} itens, preços à vista e três tamanhos por bebida. Toque em um item para ver os detalhes.
    </motion.p>
  )

  const cta = (
    <motion.div {...fadeUp(0.45)}>
      <button
        type="button"
        onClick={onStart}
        className="group inline-flex min-h-12 items-center gap-3 rounded-full py-1.5 pr-1.5 pl-6 text-[15px] font-semibold transition-colors duration-300 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#D4E9E2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3932]"
        style={{ background: sb.cream, color: sb.house }}
      >
        Ver o cardápio
        <span className="grid size-9 place-items-center rounded-full transition-transform duration-500 group-hover:translate-y-0.5" style={{ background: sb.green, color: sb.cream }}>
          <ArrowDown className="size-4" aria-hidden />
        </span>
      </button>
    </motion.div>
  )

  const masthead = (
    <motion.div {...fadeUp(0.05)} className="flex items-center gap-3">
      <img src={SIREN} width={237} height={240} alt="" className="size-11" />
      <span className="leading-tight">
        <span className="block text-[13px]" style={{ ...label, letterSpacing: '0.22em', fontWeight: 700, color: sb.cream }}>
          Starbucks
        </span>
        <span className="block text-[12.5px]" style={{ color: 'rgba(242,240,235,.62)' }}>
          Cardápio digital{showDemo ? ' · demo não oficial' : ''}
        </span>
      </span>
    </motion.div>
  )

  const leadCaption = lead && (
    <button
      type="button"
      onClick={() => onOpen(lead)}
      className="group inline-flex min-h-11 items-center gap-3 rounded-full py-2 pr-4 pl-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#D4E9E2]"
      style={{ background: 'rgba(16,36,30,.55)', color: sb.cream, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <span className="grid size-8 place-items-center rounded-full text-[10px] tabular-nums" style={{ ...label, letterSpacing: '0.04em', background: sb.cream, color: sb.house }}>
        {String(leadNumber ?? 0).padStart(2, '0')}
      </span>
      <span className="text-[14px] leading-tight">
        <span className="block font-semibold">{lead.name}</span>
        <span className="block tabular-nums" style={{ color: 'rgba(242,240,235,.72)' }}>
          a partir de {formatBRL(minPrice)}
        </span>
      </span>
      <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
    </button>
  )

  const photoImg = (sizes: string, pos: string) => (
    <motion.img
      src={leadSrc}
      alt=""
      width={960}
      height={1200}
      fetchPriority="high"
      decoding="async"
      sizes={sizes}
      className={`absolute inset-0 h-full w-full object-cover ${pos}`}
      initial={animate ? { scale: 1.08, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.4, ease }}
    />
  )

  /* ---------------------------------------------------------------- celular / tablet / moldura */
  const compact = (
    <div className={embedded ? '' : 'lg:hidden'}>
      <div className={`relative overflow-hidden ${embedded ? 'h-[250px]' : 'h-[min(88vw,46svh)] min-h-[290px] sm:h-[min(70vw,52svh)]'}`}>
        <motion.div className="absolute inset-0" style={parallax ? { y: photoY } : undefined}>
          {photoImg('100vw', 'object-[50%_38%]')}
        </motion.div>
        <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(30,57,50,0) 0%, rgba(30,57,50,0) 46%, rgba(30,57,50,.82) 80%, ${sb.house} 100%)` }} />
      </div>
      <div className={`relative ${embedded ? '-mt-16 px-4 pb-7' : '-mt-20 px-5 pb-9 sm:-mt-28 sm:px-8 sm:pb-12'}`}>
        {headline(embedded ? 'text-[46px]' : 'text-[clamp(50px,14vw,96px)]')}
        <div className="mt-5 grid gap-5">
          {intro}
          {cta}
        </div>
      </div>
    </div>
  )

  return (
    <section ref={ref} aria-label="Abertura" className="relative isolate overflow-hidden" style={{ background: sb.house }}>
      {compact}

      {/* -------------------------------------------------------------- desktop */}
      {!embedded && (
        <div className="relative hidden h-[clamp(460px,62svh,580px)] lg:block">
          <div className="absolute inset-y-0 left-0 w-[56%] overflow-hidden">
            <motion.div className="absolute -inset-y-12 inset-x-0" style={parallax ? { y: photoY } : undefined}>
              {photoImg('56vw', 'object-[50%_42%]')}
            </motion.div>
            {/* a foto tem fundo verde: ela se dissolve no verde da casa onde o título entra */}
            <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(30,57,50,0) 46%, rgba(30,57,50,.55) 70%, rgba(30,57,50,.92) 88%, ${sb.house} 100%)` }} />
            <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(30,57,50,0) 70%, rgba(30,57,50,.5) 100%)' }} />
            <motion.div {...fadeUp(0.7)} className="absolute bottom-7 left-10">
              {leadCaption}
            </motion.div>
          </div>

          <div className={`${wrapClass()} relative grid h-full grid-cols-12 gap-x-6 py-10`}>
            <div className="col-span-7 col-start-6 flex flex-col justify-center gap-7">
              <div className="ml-[calc((100%-6*24px)/7+24px)]">{masthead}</div>
              {headline('text-[clamp(72px,7vw,124px)]')}
              <div className="ml-[calc((100%-6*24px)/7+24px)] grid max-w-[480px] gap-6">
                {intro}
                {cta}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * As três campanhas do Starbucks Demo, cada uma com composição própria. O pôster aparece sempre inteiro
 * (largura definida, altura pela proporção 4:5 original), sobre um fundo que conversa com a arte:
 *  01 Iced Caramelo Macchiato — painel menta; o pôster sobe para fora do painel.
 *  02 Caramelo Frappuccino   — faixa cor de chantilly com caramelo; o título abraça o pôster pelos lados.
 *  03 Strawberry Açaí Refresher — faixa rosada; pôster à direita, sabores empilhados à esquerda.
 * O Refresher é só peça editorial: não está entre os itens do cardápio.
 */
import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import type { PublicProduct } from '@/lib/public-menu'
import { formatBRL } from '@/lib/format'
import { priceFrom } from './Catalog'
import { display, ease, label, sb, wrapClass } from './tokens'

type Props = { product?: PublicProduct; onOpen: (p: PublicProduct) => void; animate: boolean }

function Poster({ src, alt, animate, className, drift = 36 }: { src: string; alt: string; animate: boolean; className?: string; drift?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift])
  return (
    <motion.div ref={ref} className={className} style={animate ? { y } : undefined}>
      <motion.img
        src={`/demo/starbucks/${src}.webp`}
        srcSet={`/demo/starbucks/${src}-sm.webp 520w, /demo/starbucks/${src}.webp 1000w`}
        sizes="(min-width: 1024px) 34vw, 92vw"
        alt={alt}
        width={1000}
        height={1250}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full rounded-[22px]"
        initial={animate ? { opacity: 0, scale: 0.96 } : false}
        whileInView={animate ? { opacity: 1, scale: 1 } : undefined}
        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        transition={{ duration: 1.1, ease }}
      />
    </motion.div>
  )
}

function Reveal({ animate, delay = 0, className, children }: { animate: boolean; delay?: number; className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={className}
      initial={animate ? { opacity: 0, y: 22 } : false}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

function ProductLink({ product, onOpen, color, ring }: { product?: PublicProduct; onOpen: (p: PublicProduct) => void; color: string; ring: string }) {
  if (!product) return null
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="group inline-flex min-h-12 items-center gap-3 rounded-full border py-1.5 pr-1.5 pl-5 text-left text-[15px] font-semibold transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ color, borderColor: `${color}40`, ['--tw-ring-color' as string]: ring }}
    >
      <span>
        {product.name} <span className="font-normal whitespace-nowrap opacity-75">· a partir de {formatBRL(priceFrom(product))}</span>
      </span>
      <span className="grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45" style={{ background: color, color: sb.cream }}>
        <ArrowUpRight className="size-4" aria-hidden />
      </span>
    </button>
  )
}

const tag = (n: number, extra?: string) => `Campanha ${String(n).padStart(2, '0')} / 03${extra ? ` · ${extra}` : ''}`

/* -------------------------------------------------------------------------------------------- 01 */
export function CampaignMacchiato({ product, onOpen, animate }: Props) {
  return (
    <aside aria-label="Campanha: Iced Caramelo Macchiato" className={`${wrapClass()} pt-16 lg:pt-28`}>
      <div className="relative grid gap-8 rounded-[36px] px-5 pb-10 sm:px-10 lg:grid-cols-12 lg:gap-x-6 lg:px-12 lg:pb-14" style={{ background: sb.mint }}>
        <Poster
          src="campanha-cafe-gelado-caramelo"
          alt="Pôster da campanha Iced Caramelo Macchiato"
          animate={animate}
          className="-mt-12 mx-auto w-full max-w-[360px] drop-shadow-[0_40px_50px_rgba(30,57,50,.28)] lg:col-span-4 lg:-mt-16 lg:max-w-none"
        />
        <Reveal animate={animate} className="lg:col-span-7 lg:col-start-6 lg:self-end">
          <p className="text-[12px]" style={{ ...label, color: sb.green }}>
            {tag(1)}
          </p>
          <p className="mt-5 text-[clamp(40px,4.8vw,78px)] leading-[0.9]" style={{ ...display(), color: sb.house, letterSpacing: '-0.035em' }}>
            Caramelo que <em style={{ color: sb.green }}>desce gelado.</em>
          </p>
          <div className="mt-8 grid gap-6 border-t pt-6 sm:grid-cols-2 sm:gap-10" style={{ borderColor: 'rgba(30,57,50,.18)' }}>
            <p className="text-[16px] leading-relaxed" style={{ color: '#2f4a41' }}>
              Leite gelado com baunilha, espresso por cima e a calda de caramelo escorrendo pelo copo.
            </p>
            <dl className="grid grid-cols-3 gap-3 text-[13px]" style={{ color: sb.house }}>
              {[
                ['Base', 'Leite'],
                ['Café', 'Espresso'],
                ['Topo', 'Caramelo'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt style={{ ...label, letterSpacing: '0.12em', fontSize: 10.5, color: sb.green }}>{k}</dt>
                  <dd className="mt-1 text-[17px]" style={display()}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-8">
            <ProductLink product={product} onOpen={onOpen} color={sb.house} ring={sb.accent} />
          </div>
        </Reveal>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------------------------- 02 */
const CREAM_CARAMEL = '#EADBC6'
export function CampaignFrappuccino({ product, onOpen, animate }: Props) {
  const big = 'text-[clamp(48px,6vw,104px)] leading-[0.88]'
  return (
    <aside aria-label="Campanha: Caramelo Frappuccino" style={{ background: CREAM_CARAMEL, color: sb.brown }}>
      <div className={`${wrapClass()} grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)_minmax(0,1fr)] lg:gap-12 lg:py-20`}>
        <Reveal animate={animate} className="lg:self-start lg:text-right">
          <p className="text-[12px]" style={{ ...label, color: sb.brown }}>
            {tag(2)}
          </p>
          <p className={`mt-5 lg:mt-10 ${big}`} style={{ ...display(), color: sb.house, letterSpacing: '-0.04em' }}>
            Chantilly
          </p>
          <p className={`${big} lg:hidden`} style={{ ...display(), color: sb.brown, letterSpacing: '-0.04em' }}>
            <em>no topo, sempre.</em>
          </p>
        </Reveal>
        <Poster src="campanha-frappuccino-chantilly" alt="Pôster da campanha Caramelo Frappuccino" animate={animate} drift={28} className="mx-auto w-full max-w-[360px] drop-shadow-[0_36px_44px_rgba(92,64,51,.3)]" />
        <Reveal animate={animate} delay={0.1} className="lg:self-end">
          <p className={`hidden lg:block ${big}`} style={{ ...display(), color: sb.brown, letterSpacing: '-0.04em' }}>
            <em>no topo,</em>
            <br />
            <em>sempre.</em>
          </p>
          <p className="mt-6 max-w-[34ch] text-[16px] leading-relaxed lg:mt-8" style={{ color: '#6b4f3e' }}>
            Café batido com gelo e caramelo, chantilly generoso e mais caramelo por cima.
          </p>
          <div className="mt-7">
            <ProductLink product={product} onOpen={onOpen} color={sb.brown} ring={sb.brown} />
          </div>
        </Reveal>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------------------------- 03 */
const WINE = '#5a1622'
export function CampaignRefresher({ animate }: { animate: boolean }) {
  return (
    <aside aria-label="Campanha da estação: Strawberry Açaí Refresher" style={{ background: '#F4DFE0', color: WINE }}>
      <div className={`${wrapClass()} grid gap-12 py-14 lg:grid-cols-12 lg:items-center lg:gap-x-6 lg:py-20`}>
        <Reveal animate={animate} className="lg:col-span-7">
          <p className="text-[12px]" style={{ ...label, color: '#9c2f3f' }}>
            {tag(3, 'da estação')}
          </p>
          <p className="mt-5 text-[clamp(40px,5vw,76px)] leading-[0.92]" style={{ ...display(), letterSpacing: '-0.035em' }}>
            Strawberry Açaí <em style={{ color: '#b0364a' }}>Refresher</em>
          </p>
          <ol className="mt-10 border-t" style={{ borderColor: 'rgba(90,22,34,.18)' }}>
            {[
'Morango', 'Açaí', 'Gelo'].map((word, i) => (
              <li key={word} className="flex items-baseline justify-between gap-4 border-b py-3 sm:py-4" style={{ borderColor: 'rgba(90,22,34,.18)' }}>
                <span className="flex items-baseline gap-4">
                  <span className="text-[11px] tabular-nums" style={{ ...label, color: '#b0364a' }}>
                    0{i + 1}
                  </span>
                  <em className="text-[clamp(30px,3.6vw,52px)] leading-none" style={display()}>
                    {word}
                  </em>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-[48ch] text-[14px] leading-relaxed" style={{ color: '#7d4651' }}>
            Peça editorial da campanha visual. O Refresher não faz parte dos itens deste cardápio demonstrativo.
          </p>
        </Reveal>
        <Poster
          src="campanha-refresher"
          alt="Pôster da campanha Strawberry Açaí Refresher"
          animate={animate}
          className="mx-auto w-full max-w-[360px] drop-shadow-[0_40px_50px_rgba(90,22,34,.32)] lg:col-span-4 lg:col-start-9 lg:max-w-none"
        />
      </div>
    </aside>
  )
}

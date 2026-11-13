import { assetUrl } from '@/lib/site'
/**
 * La Brasa — cardápio exclusivo (hamburgueria).
 * Direção: street burger brutalista. Carvão, osso, mostarda e brasa;
 * Big Shoulders Display (títulos) + Archivo (texto); fotos reais como protagonistas.
 * Logo e fotos: material enviado pelo cliente.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Clock, Flame, MapPin, X } from 'lucide-react'
import { groupByCategory, productImage, type MenuThemeProps, type PublicCategory, type PublicProduct } from '@/lib/public-menu'
import { mediaUrl } from '@/lib/supabase'
import { formatPriceShort } from '@/lib/format'
import { useCategoryScroll, usePageChrome, useStylesheet } from '../hooks'
import { Or7Signature } from '@/components/brand/Logo'

const c = {
  coal: '#0E0C0A',
  char: '#171411',
  ash: '#2A2520',
  bone: '#F3ECDF',
  smoke: '#A69D8F',
  mustard: '#F5B301',
  ember: '#E8501E',
}
const display = "'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif"
const body = "'Archivo', ui-sans-serif, system-ui, sans-serif"
const BURGER_GROUP = ['burgers', 'smashs', 'doces']
/** foto da campanha: o Australiano cortado, a mais apetitosa do material recebido */
const HERO_PHOTO = assetUrl('/demo/la-brasa/australiano-2.webp')
const ALT_PHOTOS = new Set(['australiano', 'costelao', 'la-queso', 'smash-cheddar', 'smash-catupiry', 'burger-nutella', 'caramelo', 'goudog', 'batata-ondulada', 'onion-rings', 'milkshake-morango', 'milkshake-oreo'])

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Fotos do produto: principal + segundo ângulo, quando existir. */
function gallery(path: string | null) {
  const main = productImage(path, 960)
  if (!main) return []
  const m = path?.match(/^\/demo\/la-brasa\/([a-z0-9-]+)\.webp$/)
  return m && ALT_PHOTOS.has(m[1]!) ? [main, assetUrl(`/demo/la-brasa/${m[1]}-2.webp`)] : [main]
}

/** Aberto todos os dias das 18h30 às 23h30 (horário de Curitiba). */
function useOpenNow() {
  const calc = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
    const h = Number(parts.find((p) => p.type === 'hour')?.value)
    const m = Number(parts.find((p) => p.type === 'minute')?.value)
    const mins = h * 60 + m
    return mins >= 18 * 60 + 30 && mins < 23 * 60 + 30
  }
  const [open, setOpen] = useState(calc)
  useEffect(() => {
    const t = window.setInterval(() => setOpen(calc()), 60_000)
    return () => window.clearInterval(t)
  }, [])
  return open
}

function PriceTag({ value, size = 'md', muted }: { value: number; size?: 'sm' | 'md' | 'lg'; muted?: boolean }) {
  const fs = { sm: 15, md: 19, lg: 30 }[size]
  return (
    <span
      className="inline-flex items-baseline gap-0.5 px-2 py-0.5 leading-none font-extrabold tabular-nums"
      style={{ background: muted ? c.ash : c.mustard, color: muted ? c.smoke : c.coal, fontFamily: display, fontSize: fs, letterSpacing: '0.01em' }}
    >
      <span style={{ fontSize: fs * 0.62 }}>R$</span>
      {formatPriceShort(value)}
    </span>
  )
}

export default function LaBrasaMenu({ menu, isDemoData, embedded, lite }: MenuThemeProps) {
  useStylesheet('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Big+Shoulders+Display:wght@700;800;900&display=swap')
  usePageChrome(!embedded, { track: c.coal, thumb: '#3B332B', hover: `linear-gradient(180deg, ${c.mustard}, ${c.ember})`, themeColor: c.coal })
  const reduce = useReducedMotion()
  const animate = !reduce && !lite
  const open = useOpenNow()
  const groups = useMemo(() => groupByCategory(menu), [menu])
  const scrollRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const { active, goTo, register } = useCategoryScroll(
    groups.map((g) => g.category.id),
    { container: scrollRef, embedded, offset: 58, disabled: lite },
  )
  const [selected, setSelected] = useState<PublicProduct | null>(null)
  const est = menu.establishment
  const logo = mediaUrl(est.logo_path) ?? assetUrl('/demo/la-brasa/logo.webp')
  const mapsHref = est.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(est.address)}` : null
  const catName = useMemo(() => Object.fromEntries(menu.categories.map((x) => [x.id, x.name])), [menu.categories])
  const highlights = useMemo(() => {
    const ids = groups.filter((g) => BURGER_GROUP.includes(norm(g.category.name))).flatMap((g) => g.products)
    return (ids.length ? ids : menu.products).filter((p) => p.is_available && p.image_path).slice(0, 4)
  }, [groups, menu.products])
  const wide = !embedded

  useEffect(() => {
    const bar = chipsRef.current
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
    if (bar && chip) bar.scrollTo({ left: chip.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' })
  }, [active, reduce])

  const showDemo = isDemoData || est.slug === 'la-brasa'

  return (
    <div className="relative h-full" style={{ background: c.coal, color: c.bone, fontFamily: body }}>
      <div ref={scrollRef} className={embedded ? 'no-scrollbar h-full overflow-y-auto overscroll-contain' : 'min-h-dvh'}>
        {/* ------------------------------------------------------------ HERO
            Street Burger Editorial: foto real em sangria, logo como selo,
            headline condensada sobreposta à foto, fita da marca e ticket de serviço. */}
        <header className="relative isolate overflow-hidden" style={{ background: c.coal }}>
          <div className={wide ? 'relative lg:grid lg:min-h-[640px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : 'relative'}>
            {/* foto */}
            <div className={wide ? 'relative h-[74svh] max-h-[640px] min-h-[460px] lg:order-2 lg:h-auto lg:max-h-none' : 'relative h-[470px]'}>
              <motion.img
                src={HERO_PHOTO}
                alt="Hambúrguer Australiano do La Brasa, cortado ao meio"
                className="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
                fetchPriority="high"
                initial={animate ? { scale: 1.08, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* leitura: escurece embaixo (mobile) e na borda esquerda (desktop) */}
              <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.coal}99 0%, transparent 22%, transparent 45%, ${c.coal} 100%)` }} />
              {wide && <div aria-hidden className="absolute inset-0 hidden lg:block" style={{ background: `linear-gradient(90deg, ${c.coal} 0%, ${c.coal}00 38%)` }} />}
              {/* textura de retícula */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
                style={{ backgroundImage: `radial-gradient(${c.bone} 1px, transparent 1.3px)`, backgroundSize: '6px 6px' }}
              />
              {wide && (
                <div className="absolute right-6 bottom-8 hidden lg:block">
                  <Stamp />
                </div>
              )}
            </div>

            {/* barra superior sobre a foto */}
            <div className={`absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-4 ${embedded ? 'pt-11' : 'pt-4 sm:px-8'}`}>
              {showDemo ? (
                <span className="px-2 py-1 text-[10px] font-bold tracking-[0.16em] uppercase" style={{ background: c.bone, color: c.coal }}>
                  Demonstração
                </span>
              ) : (
                <span />
              )}
              <span
                className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase"
                style={{ color: open ? c.mustard : c.bone, background: `${c.coal}CC` }}
              >
                <span className="size-2 rounded-full" style={{ background: open ? '#5FD068' : c.smoke, boxShadow: open ? '0 0 8px #5FD068' : 'none' }} />
                {open ? 'Aberto agora' : embedded ? 'Abre 18h30' : 'Fechado · abre 18h30'}
              </span>
            </div>

            {/* bloco tipográfico: sobrepõe a foto */}
            <div
              className={
                wide
                  ? 'relative z-10 -mt-[210px] px-5 pb-8 sm:-mt-[240px] sm:px-8 lg:order-1 lg:mt-0 lg:flex lg:flex-col lg:justify-end lg:py-14 lg:pr-0 lg:pl-[max(2rem,calc((100vw-72rem)/2))]'
                  : 'relative z-10 -mt-[200px] px-4 pb-6'
              }
            >
              <motion.img
                src={logo}
                alt={est.name}
                width={420}
                height={671}
                className={`block aspect-[420/671] shrink-0 self-start object-contain ${embedded ? 'mb-4 h-[92px] w-auto' : 'mb-5 h-[104px] w-auto sm:h-[124px] lg:mb-8 lg:h-[180px]'}`}
                initial={animate ? { opacity: 0, y: 12, rotate: -4 } : false}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 150, damping: 16, delay: 0.15 }}
              />
              <motion.h1
                className={`leading-[0.82] font-black uppercase ${embedded ? 'text-[56px]' : 'text-[64px] sm:text-[92px] lg:-mr-40 lg:text-[132px]'}`}
                style={{ fontFamily: display, textShadow: '0 4px 30px rgba(0,0,0,.45)' }}
                initial={animate ? { opacity: 0, y: 24 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                Fome
                <br />
                de <span style={{ color: c.mustard }}>brasa.</span>
              </motion.h1>
              <motion.p
                className={`mt-4 max-w-[30ch] leading-snug ${embedded ? 'text-[14px]' : 'text-[15px] sm:text-[17px]'}`}
                style={{ color: c.bone }}
                initial={animate ? { opacity: 0 } : false}
                animate={{ opacity: 0.85 }}
                transition={{ delay: 0.5 }}
              >
                Blend na brasa, smash na chapa e pão macio. Escolha a categoria e vá direto ao ponto.
              </motion.p>

              {/* atalhos para as categorias: o cardápio continua a um toque */}
              <motion.ul
                className="mt-5 flex flex-wrap gap-1.5"
                initial={animate ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                aria-label="Ir para a categoria"
              >
                {groups.slice(0, embedded ? 4 : 7).map(({ category }, i) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => goTo(category.id)}
                      className="px-3 py-2 text-[14px] font-extrabold tracking-[0.04em] uppercase transition-colors"
                      style={
                        i === 0
                          ? { fontFamily: display, background: c.mustard, color: c.coal }
                          : { fontFamily: display, background: `${c.coal}B3`, color: c.bone, boxShadow: `inset 0 0 0 1px ${c.ash}` }
                      }
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </motion.ul>
            </div>
          </div>

          {/* fita da marca */}
          <div aria-hidden className="relative z-10 -my-1 overflow-hidden py-2" style={{ background: c.mustard, color: c.coal, transform: 'rotate(-1.2deg)', marginInline: '-2%' }}>
            <p className="text-center text-[15px] font-black tracking-[0.18em] whitespace-nowrap uppercase" style={{ fontFamily: display }}>
              {'La Brasa ✶ Street burger ✶ Feito na brasa ✶ '.repeat(4)}
            </p>
          </div>

          {/* ticket de serviço: horário + endereço */}
          <div className={wide ? 'mx-auto max-w-6xl px-5 pt-6 pb-4 sm:px-8' : 'px-4 pt-5 pb-3'}>
            <div className="grid border sm:grid-cols-[auto_1fr]" style={{ borderColor: c.ash }}>
              {est.opening_hours && (
                <p className="flex items-center gap-2.5 px-4 py-3 text-[13px] sm:border-r" style={{ borderColor: c.ash }}>
                  <Clock className="size-4 shrink-0" style={{ color: c.mustard }} aria-hidden />
                  <span>
                    <span className="block text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: c.smoke }}>
                      Horário
                    </span>
                    {est.opening_hours}
                  </span>
                </p>
              )}
              {est.address && mapsHref && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2.5 border-t px-4 py-3 text-[13px] transition-colors hover:bg-white/[0.03] sm:border-t-0"
                  style={{ borderColor: c.ash }}
                  aria-label={`Ver ${est.address} no mapa (abre em nova aba)`}
                >
                  <MapPin className="size-4 shrink-0" style={{ color: c.mustard }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: c.smoke }}>
                      Onde estamos · ver no mapa
                    </span>
                    <span className="block truncate">{est.address}</span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </a>
              )}
            </div>
          </div>
        </header>

        {/* -------------------------------------------------------- DESTAQUES */}
        {highlights.length > 1 && (
          <section aria-label="Destaques da casa" className={wide ? 'mx-auto max-w-6xl px-5 pt-4 pb-6 sm:px-8' : 'pt-2 pb-4'}>
            <p className={`mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase ${wide ? '' : 'px-4'}`} style={{ color: c.ember }}>
              <Flame className="size-3.5" aria-hidden /> Destaques da casa
            </p>
            <div className={`no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto ${wide ? 'lg:grid lg:grid-cols-4 lg:overflow-visible' : 'px-4'}`}>
              {highlights.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className="group relative w-[64%] shrink-0 snap-start overflow-hidden text-left sm:w-[40%] lg:w-auto"
                  aria-label={`Destaque: ${p.name}, R$ ${formatPriceShort(p.price)}. Ver detalhes`}
                >
                  <img src={productImage(p.image_path, 480) ?? ''} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3" style={{ background: `linear-gradient(transparent, ${c.coal}EE)` }}>
                    <span className="text-[24px] leading-none font-black uppercase" style={{ fontFamily: display }}>
                      {p.name}
                    </span>
                    <PriceTag value={p.price} size="sm" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* --------------------------------------------------- NAV CATEGORIAS */}
        <nav aria-label="Categorias" className="sticky top-0 z-20 border-y backdrop-blur-md" style={{ background: `${c.coal}F0`, borderColor: c.ash }}>
          <div ref={chipsRef} className={`no-scrollbar flex gap-1.5 overflow-x-auto py-2.5 ${wide ? 'mx-auto max-w-6xl px-5 sm:px-8' : 'px-3'}`}>
            {groups.map(({ category }) => {
              const on = category.id === active
              return (
                <button
                  key={category.id}
                  data-chip={category.id}
                  type="button"
                  onClick={() => goTo(category.id)}
                  aria-current={on ? 'true' : undefined}
                  className="relative shrink-0 px-3.5 py-2 text-[15px] font-extrabold tracking-[0.04em] whitespace-nowrap uppercase transition-colors"
                  style={{ fontFamily: display, color: on ? c.coal : c.bone }}
                >
                  {on && (
                    <motion.span
                      layoutId={`lb-chip-${embedded ? 'e' : 'p'}`}
                      className="absolute inset-0"
                      style={{ background: c.mustard }}
                      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                    />
                  )}
                  <span className="relative">{category.name}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* ----------------------------------------------------- CATEGORIAS */}
        <main className={wide ? 'mx-auto max-w-6xl px-5 sm:px-8' : 'px-4'}>
          {groups.length === 0 && <p className="py-20 text-center text-lg">O cardápio está sendo preparado.</p>}
          {groups.map(({ category, products }) => (
            <CategorySection
              key={category.id}
              category={category}
              products={products}
              burgerIndex={BURGER_GROUP.indexOf(norm(category.name))}
              register={register(category.id)}
              wide={wide}
              animate={animate}
              root={embedded ? scrollRef : undefined}
              onOpen={setSelected}
            />
          ))}
        </main>

        {/* ---------------------------------------------------------- RODAPÉ */}
        <footer className="mt-14 border-t" style={{ borderColor: c.ash, background: c.char }}>
          <div className={`grid gap-6 py-10 ${wide ? 'mx-auto max-w-6xl px-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10 sm:px-8' : 'px-5'}`}>
            <img src={logo} alt={est.name} width={420} height={671} loading="lazy" className="block aspect-[420/671] h-28 w-auto shrink-0 self-start object-contain" />
            <div className="grid gap-2.5 text-[14px]" style={{ color: c.smoke }}>
              {est.opening_hours && (
                <p className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" style={{ color: c.mustard }} aria-hidden /> {est.opening_hours}
                </p>
              )}
              {est.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: c.mustard }} aria-hidden />
                  <span>
                    {est.address}
                    {mapsHref && (
                      <>
                        {' · '}
                        <a href={mapsHref} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4" style={{ color: c.bone }}>
                          Ver no mapa
                        </a>
                      </>
                    )}
                  </span>
                </p>
              )}
              <p className="mt-3 text-[12px]">
                {showDemo ? 'Cardápio demonstrativo: preços e descrições ilustrativos. ' : ''}Cardápio digital por Or7 Table.
              </p>
              <Or7Signature className="mt-4 w-[190px] opacity-70" />
            </div>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {selected && (
          <ProductSheet
            key={selected.id}
            product={selected}
            category={catName[selected.category_id]}
            position={embedded ? 'absolute' : 'fixed'}
            embedded={embedded}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Stamp() {
  const reduce = useReducedMotion()
  const text = 'FEITO NA BRASA • LA BRASA • STREET BURGER • '
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="absolute -top-2 -right-2 size-28"
      aria-hidden
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <path id="lb-stamp" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill={c.mustard} />
      <text fontSize="10.5" fontWeight="800" letterSpacing="2" fill={c.coal} fontFamily={display}>
        <textPath href="#lb-stamp">{text}</textPath>
      </text>
      <path d="M60 40c-10 8-6 16 0 22-2-6 2-10 6-12 2 8-2 14-6 18 10-2 14-10 12-18-2-6-8-8-12-10z" fill={c.ember} />
    </motion.svg>
  )
}

const CategorySection = memo(function CategorySection({
  category,
  products,
  burgerIndex,
  register,
  wide,
  animate,
  root,
  onOpen,
}: {
  category: PublicCategory
  products: PublicProduct[]
  burgerIndex: number
  register: (el: HTMLElement | null) => void
  wide: boolean
  animate: boolean
  root?: React.RefObject<HTMLDivElement | null>
  onOpen: (p: PublicProduct) => void
}) {
  const compact = norm(category.name) === 'bebidas'
  return (
    <section ref={register} data-category={category.id} aria-labelledby={`lb-h-${category.id}`} className="pt-10">
      <div className="mb-5 flex items-end justify-between gap-4 border-b-[3px] pb-2" style={{ borderColor: c.mustard }}>
        <div>
          {burgerIndex >= 0 && (
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: c.ember }}>
              Hambúrgueres · {burgerIndex + 1}/3
            </p>
          )}
          <h2 id={`lb-h-${category.id}`} className={`leading-none font-black uppercase ${wide ? 'text-[44px] sm:text-[56px]' : 'text-[40px]'}`} style={{ fontFamily: display }}>
            {category.name}
          </h2>
        </div>
        <span className="pb-1 text-[22px] font-black tabular-nums" style={{ fontFamily: display, color: c.ash }}>
          {String(products.length).padStart(2, '0')}
        </span>
      </div>
      <ul className={`grid gap-3 ${compact ? (wide ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2') : wide ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}`}>
        {products.map((p, i) => {
          // categorias com quantidade ímpar abrem com um card largo (no celular), sem card órfão
          const feature = !compact && i === 0 && products.length % 2 === 1
          return (
          <motion.li
            key={p.id}
            className={feature ? (wide ? 'col-span-2 lg:col-span-1' : 'col-span-2') : ''}
            initial={animate ? { opacity: 0, y: 18 } : false}
            whileInView={animate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, root, margin: '0px 0px -30px 0px' }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.2), ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductCard product={p} feature={feature} responsive={wide} compact={compact} onOpen={() => onOpen(p)} />
          </motion.li>
          )
        })}
      </ul>
    </section>
  )
})

function ProductCard({
  product: p,
  feature,
  responsive,
  compact,
  onOpen,
}: {
  product: PublicProduct
  feature?: boolean
  /** em tela cheia o card largo volta ao formato normal no desktop */
  responsive?: boolean
  compact?: boolean
  onOpen: () => void
}) {
  const src = productImage(p.image_path, feature ? 960 : 440)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: c.char, outlineColor: c.mustard }}
      aria-label={`${p.name}, R$ ${formatPriceShort(p.price)}${p.is_available ? '' : ', esgotado'}. Ver detalhes`}
    >
      <span className={`relative block overflow-hidden ${feature ? (responsive ? 'aspect-[16/11] lg:aspect-[4/5]' : 'aspect-[16/11]') : 'aspect-[4/5]'}`} style={{ background: c.ash }}>
        {src && (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            style={{ filter: p.is_available ? 'none' : 'grayscale(1) brightness(.7)' }}
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          />
        )}
        <span className="absolute bottom-0 left-0">
          <PriceTag value={p.price} size={feature && !responsive ? 'lg' : 'md'} muted={!p.is_available} />
        </span>
        {!p.is_available && (
          <span
            className="absolute top-1/2 left-1/2 w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-12 py-1 text-center text-[13px] font-black tracking-[0.3em] uppercase"
            style={{ background: c.ember, color: c.bone, fontFamily: display }}
          >
            Esgotado
          </span>
        )}
      </span>
      <span className={`flex flex-1 flex-col ${compact ? 'p-2.5' : 'p-3'}`}>
        <span
          className={`leading-[0.95] font-extrabold uppercase ${feature ? (responsive ? 'text-[30px] lg:text-[21px]' : 'text-[30px]') : compact ? 'text-[17px]' : 'text-[21px]'}`}
          style={{ fontFamily: display }}
        >
          {p.name}
        </span>
        {p.description && !compact && (
          <span className={`mt-1.5 text-[12.5px] leading-snug ${feature ? 'line-clamp-2' : 'line-clamp-3'}`} style={{ color: c.smoke }}>
            {p.description}
          </span>
        )}
      </span>
    </button>
  )
}

function ProductSheet({
  product: p,
  category,
  position,
  embedded,
  onClose,
}: {
  product: PublicProduct
  category?: string
  position: 'absolute' | 'fixed'
  embedded?: boolean
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const photos = useMemo(() => gallery(p.image_path), [p.image_path])
  const [index, setIndex] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [photos.length])

  return (
    <div className={`${position} inset-0 z-50 flex items-end justify-center ${embedded ? '' : 'sm:items-center sm:p-6'}`}>
      <motion.div className="absolute inset-0" style={{ background: 'rgba(8,7,6,.78)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
        initial={reduce ? { opacity: 0 } : { y: '100%' }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        exit={reduce ? { opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 38 }}
        className={`no-scrollbar relative max-h-[92%] w-full overflow-y-auto ${embedded ? '' : 'sm:max-h-[90dvh] sm:max-w-[440px]'}`}
        style={{ background: c.char, color: c.bone, fontFamily: body, borderTop: `4px solid ${c.mustard}` }}
      >
        {/* foto principal grande + segunda foto como miniatura editorial sobreposta */}
        <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: c.ash }}>
          <AnimatePresence initial={false}>
            <motion.img
              key={photos[index]}
              src={photos[index]}
              alt={index === 0 ? p.name : `${p.name}, outro ângulo`}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: p.is_available ? 'none' : 'grayscale(1)' }}
              initial={reduce ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="absolute top-3 right-3 z-10 grid size-11 place-items-center"
            style={{ background: c.coal, color: c.bone }}
          >
            <X className="size-5" />
          </button>
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i === 0 ? 1 : 0))}
              aria-label={index === 0 ? 'Ver outro ângulo da foto' : 'Voltar para a foto principal'}
              className="group absolute right-3 bottom-3 z-10 w-[30%] max-w-[132px] rotate-[2.5deg] p-1 shadow-[0_12px_30px_rgba(0,0,0,.6)] transition-transform duration-300 hover:rotate-0 active:scale-95"
              style={{ background: c.bone }}
            >
              <span className="relative block aspect-[4/5] overflow-hidden">
                <AnimatePresence initial={false}>
                  <motion.img
                    key={photos[index === 0 ? 1 : 0]}
                    src={productImage(photos[index === 0 ? 1 : 0]!, 440) ?? photos[index === 0 ? 1 : 0]}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
              </span>
              <span className="mt-1 flex items-center justify-between px-0.5 text-[10px] font-extrabold tracking-[0.1em] uppercase" style={{ fontFamily: display, color: c.coal }}>
                <span>{index === 0 ? 'Outro ângulo' : 'Foto principal'}</span>
                <span aria-hidden className="tabular-nums">{index + 1}/2</span>
              </span>
            </button>
          )}
        </div>
        <div className="px-5 pt-5 pb-7">
          {category && (
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: c.ember }}>
              {category}
            </p>
          )}
          <h3 className="mt-1 text-[42px] leading-[0.9] font-black uppercase" style={{ fontFamily: display }}>
            {p.name}
          </h3>
          {p.description && (
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: c.smoke }}>
              {p.description}
            </p>
          )}
          <div className="mt-6 flex items-center justify-between gap-3 border-t pt-5" style={{ borderColor: c.ash }}>
            <PriceTag value={p.price} size="lg" muted={!p.is_available} />
            <span className="text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color: p.is_available ? '#7EDB86' : c.ember }}>
              {p.is_available ? 'Disponível' : 'Esgotado hoje'}
            </span>
          </div>
        </div>
      </motion.article>
    </div>
  )
}

/**
 * Catálogo editorial do Starbucks Demo. Cada categoria tem uma composição própria, mas todas usam as
 * mesmas peças (número, nome, descrição, tabela de tamanhos), para o cliente achar sempre o preço no
 * mesmo lugar:
 *  - Cafés quentes: destaque grande + dois itens compactos;
 *  - Cafés gelados: tríptico escalonado;
 *  - Frappuccinos: faixa verde com fotos em arco;
 *  - Comidas: lista tipográfica com pontilhado até o preço e prévia da foto ao passar o mouse.
 * No celular, o destaque continua grande e o resto vira linhas confortáveis para o toque.
 */
import { memo, useState, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { productImage, type PublicCategory, type PublicProduct } from '@/lib/public-menu'
import { formatBRL } from '@/lib/format'
import { display, ease, label, sb, wrapClass } from './tokens'

export type Layout = 'feature' | 'triptych' | 'arches' | 'list'
type Tone = 'light' | 'dark'

export const priceFrom = (p: PublicProduct) => (p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : p.price)
export const numLabel = (n?: number) => (n ? `Nº ${String(n).padStart(2, '0')}` : '')

const ink = (tone: Tone) =>
  tone === 'dark'
    ? { title: sb.cream, body: 'rgba(242,240,235,.74)', meta: 'rgba(212,233,226,.62)', price: sb.cream, rule: 'rgba(242,240,235,.16)', accent: sb.mint, ph: '#2a4a40' }
    : { title: sb.house, body: '#5d5a53', meta: '#8f897e', price: sb.green, rule: sb.line, accent: sb.accent, ph: '#e4ddd0' }

type ViewOpts = { animate: boolean; root?: RefObject<HTMLDivElement | null> }

/* ===================================================================== peças */

function Photo({
  product,
  width,
  className,
  imgClass = '',
  tone,
  view,
  sizes,
}: {
  product: PublicProduct
  width: number
  className: string
  imgClass?: string
  tone: Tone
  view: ViewOpts
  sizes?: string
}) {
  const off = !product.is_available
  return (
    <motion.span
      className={`relative block overflow-hidden ${className}`}
      style={{ background: ink(tone).ph }}
      initial={view.animate ? { opacity: 0, y: 28 } : false}
      whileInView={view.animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, root: view.root, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.9, ease }}
    >
      <img
        src={productImage(product.image_path, width) ?? ''}
        alt=""
        loading="lazy"
        decoding="async"
        width={width}
        height={Math.round(width * 1.25)}
        sizes={sizes}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.045] ${imgClass}`}
        style={{ filter: off ? 'grayscale(1)' : undefined, opacity: off ? 0.7 : 1 }}
      />
    </motion.span>
  )
}

function Meta({ product, number, tone }: { product: PublicProduct; number?: number; tone: Tone }) {
  const c = ink(tone)
  const off = !product.is_available
  return (
    <span className="block text-[11px] tabular-nums" style={{ ...label, letterSpacing: '0.12em', color: off ? c.meta : c.accent }}>
      {numLabel(number)}
      {off && <span style={{ color: tone === 'dark' ? '#f0c9b8' : sb.brown }}> · Indisponível hoje</span>}
    </span>
  )
}

function Name({ children, className, tone }: { children: ReactNode; className: string; tone: Tone }) {
  return (
    <span
      className={`block w-fit bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-[position:0_100%] bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:bg-[length:100%_1.5px] ${className}`}
      style={{ ...display(), color: ink(tone).title, fontWeight: 400, letterSpacing: '-0.015em' }}
    >
      {children}
    </span>
  )
}

/** Tamanhos e preços. `lg`: colunas com volume; `sm`: compacto, para linhas no celular. */
export function Ladder({ product, tone, size, center }: { product: PublicProduct; tone: Tone; size: 'lg' | 'sm'; center?: boolean }) {
  const c = ink(tone)
  const off = !product.is_available
  const priceColor = off ? c.meta : c.price
  const variants = product.variants ?? []
  if (!variants.length) {
    return (
      <span className={`block tabular-nums ${size === 'lg' ? 'text-[22px]' : 'text-[17px]'}`} style={{ ...display(), color: priceColor, fontWeight: 500 }}>
        {formatBRL(product.price)}
      </span>
    )
  }
  return (
    <span className={`grid grid-cols-3 border-t ${size === 'lg' ? 'max-w-[420px] pt-3' : 'max-w-[300px] pt-2'} ${center ? 'mx-auto' : ''}`} style={{ borderColor: c.rule }}>
      {variants.map((v, i) => (
        <span key={v.label} className={`min-w-0 ${i ? 'border-l' : ''} ${center ? 'text-center' : i ? (size === 'lg' ? 'pl-3 sm:pl-4' : 'pl-2.5') : ''}`} style={{ borderColor: c.rule }}>
          <span className="block truncate text-[10.5px]" style={{ ...label, letterSpacing: '0.1em', color: c.meta }}>
            {v.label}
            {size === 'lg' && v.volume_ml ? <span className="hidden normal-case sm:inline" style={{ letterSpacing: '0.02em' }}> · {v.volume_ml} ml</span> : null}
          </span>
          <span className={`mt-0.5 block whitespace-nowrap tabular-nums ${size === 'lg' ? 'text-[19px] lg:text-[18px] xl:text-[21px]' : 'text-[14px]'}`} style={{ ...display(), color: priceColor, fontWeight: 500 }}>
            {formatBRL(v.price)}
          </span>
        </span>
      ))}
    </span>
  )
}

function ItemButton({ product, onOpen, className, children, tone }: { product: PublicProduct; onOpen: (p: PublicProduct) => void; className: string; children: ReactNode; tone: Tone }) {
  const off = !product.is_available
  const variants = product.variants ?? []
  const priceText = variants.length ? variants.map((v) => `${v.label} ${formatBRL(v.price)}`).join(', ') : formatBRL(product.price)
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      aria-label={`${product.name}. ${priceText}${off ? '. Indisponível hoje' : ''}. Ver detalhes`}
      className={`group w-full ${className.includes('text-center') ? '' : 'text-left'} outline-none transition-transform duration-200 active:scale-[0.99] focus-visible:rounded-[20px] focus-visible:ring-2 focus-visible:ring-offset-4 ${
        tone === 'dark' ? 'focus-visible:ring-[#D4E9E2] focus-visible:ring-offset-[#1E3932]' : 'focus-visible:ring-[#00754A] focus-visible:ring-offset-[#F2F0EB]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** Linha compacta: foto 4:5 + texto + tamanhos (celular e itens secundários). */
function Row({ product, number, tone, view, onOpen, arch, flip }: { product: PublicProduct; number?: number; tone: Tone; view: ViewOpts; onOpen: (p: PublicProduct) => void; arch?: boolean; flip?: boolean }) {
  const c = ink(tone)
  return (
    <ItemButton product={product} onOpen={onOpen} tone={tone} className={`grid items-start gap-4 py-5 ${flip ? 'grid-cols-[minmax(0,1fr)_104px] sm:grid-cols-[minmax(0,1fr)_150px]' : 'grid-cols-[104px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)]'} sm:gap-6`}>
      <Photo product={product} width={240} tone={tone} view={view} className={`aspect-[4/5] ${arch ? 'rounded-t-full rounded-b-[14px]' : 'rounded-[14px]'} ${flip ? 'order-2' : ''}`} />
      <span className="min-w-0">
        <Meta product={product} number={number} tone={tone} />
        <Name tone={tone} className="mt-1 text-[22px] leading-[1.08] sm:text-[26px]">
          {product.name}
        </Name>
        {product.description && (
          <span className="mt-1.5 line-clamp-2 block text-[14px] leading-snug" style={{ color: c.body }}>
            {product.description}
          </span>
        )}
        <span className="mt-3 block">
          <Ladder product={product} tone={tone} size="sm" />
        </span>
      </span>
    </ItemButton>
  )
}

/* =================================================================== cabeçalho */

function splitTitle(name: string) {
  const parts = name.split(' ')
  if (parts.length < 2) return <>{name}</>
  return (
    <>
      {parts.slice(0, -1).join(' ')} <em style={{ fontWeight: 400 }}>{parts.at(-1)}</em>
    </>
  )
}

function CategoryHeader({
  index,
  total,
  category,
  count,
  intro,
  drinks,
  tone,
  embedded,
  onSizeGuide,
}: {
  index: number
  total: number
  category: PublicCategory
  count: number
  intro?: string
  drinks: boolean
  tone: Tone
  embedded?: boolean
  onSizeGuide?: () => void
}) {
  const c = ink(tone)
  return (
    <header className={`grid border-t ${embedded ? 'gap-3 pt-5' : 'gap-5 pt-6 lg:grid-cols-12 lg:gap-x-6 lg:pt-8'}`} style={{ borderColor: tone === 'dark' ? c.rule : sb.house + '33' }}>
      <p className={`text-[12px] tabular-nums ${embedded ? '' : 'lg:col-span-2 lg:pt-4'}`} style={{ ...label, color: c.accent }}>
        {String(index + 1).padStart(2, '0')} <span style={{ color: c.meta }}>/ {String(total).padStart(2, '0')} · {count} itens</span>
      </p>
      <h2
        id={`sb-h-${category.id}`}
        className={embedded ? 'text-[38px] leading-[0.95]' : 'text-[clamp(48px,7.4vw,112px)] leading-[0.9] lg:col-span-6'}
        style={{ ...display(), color: c.title, fontWeight: 400, letterSpacing: '-0.035em' }}
      >
        {splitTitle(category.name)}
      </h2>
      {!embedded && (intro || drinks) && (
        <div className="max-w-[420px] lg:col-span-4 lg:self-end lg:pb-2">
          {intro && (
            <p className="text-[16px] leading-relaxed sm:text-[17px]" style={{ color: c.body }}>
              {intro}
            </p>
          )}
          {drinks && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]" style={{ color: c.meta }}>
              Tall 300 ml · Grande 400 ml · Venti 500 ml
              {onSizeGuide && (
                <button
                  type="button"
                  onClick={onSizeGuide}
                  className="inline-flex min-h-9 items-center gap-1 rounded font-semibold underline underline-offset-4 outline-none focus-visible:ring-2"
                  style={{ color: c.accent, textDecorationColor: tone === 'dark' ? 'rgba(212,233,226,.4)' : 'rgba(0,117,74,.4)' }}
                >
                  Guia de tamanhos <ArrowDown className="size-3.5" aria-hidden />
                </button>
              )}
            </p>
          )}
        </div>
      )}
    </header>
  )
}

/* ==================================================================== layouts */

type SectionProps = {
  index: number
  total: number
  category: PublicCategory
  products: PublicProduct[]
  layout: Layout
  intro?: string
  embedded?: boolean
  numberOf: Map<string, number>
  view: ViewOpts
  onOpen: (p: PublicProduct) => void
  onSizeGuide?: () => void
}

export const CategorySection = memo(function CategorySection(props: SectionProps) {
  const { index, total, category, products, layout, intro, embedded, numberOf, view, onOpen, onSizeGuide } = props
  const tone: Tone = layout === 'arches' ? 'dark' : 'light'
  const drinks = products.some((p) => p.variants?.length)
  const n = (p: PublicProduct) => numberOf.get(p.id)

  const header = <CategoryHeader index={index} total={total} category={category} count={products.length} intro={intro} drinks={drinks} tone={tone} embedded={embedded} onSizeGuide={onSizeGuide} />

  let body: ReactNode
  if (embedded) {
    const [lead, ...rest] = products
    body = (
      <div className="mt-4">
        {lead && index === 0 ? <Feature product={lead} number={n(lead)} view={view} onOpen={onOpen} embedded /> : lead && <Row product={lead} number={n(lead)} tone={tone} view={view} onOpen={onOpen} arch={layout === 'arches'} />}
        {rest.map((p) => (
          <div key={p.id} className="border-t" style={{ borderColor: ink(tone).rule }}>
            <Row product={p} number={n(p)} tone={tone} view={view} onOpen={onOpen} arch={layout === 'arches'} />
          </div>
        ))}
      </div>
    )
  } else if (layout === 'feature') body = <FeatureLayout products={products} n={n} view={view} onOpen={onOpen} />
  else if (layout === 'triptych') body = <TriptychLayout products={products} n={n} view={view} onOpen={onOpen} />
  else if (layout === 'arches') body = <ArchesLayout products={products} n={n} view={view} onOpen={onOpen} />
  else body = <ListLayout products={products} n={n} view={view} onOpen={onOpen} />

  if (tone === 'dark') {
    return (
      <section aria-labelledby={`sb-h-${category.id}`} className={embedded ? 'pt-6 pb-6' : 'py-16 lg:py-24'} style={{ background: sb.house, color: sb.cream }}>
        <div className={wrapClass(embedded)}>
          {header}
          {body}
        </div>
      </section>
    )
  }
  return (
    <section aria-labelledby={`sb-h-${category.id}`}>
      <div className={wrapClass(embedded)}>
        {header}
        {body}
      </div>
    </section>
  )
})

type LayoutProps = { products: PublicProduct[]; n: (p: PublicProduct) => number | undefined; view: ViewOpts; onOpen: (p: PublicProduct) => void }

/** Item em destaque: foto grande + texto amplo. */
function Feature({ product, number, view, onOpen, embedded }: { product: PublicProduct; number?: number; view: ViewOpts; onOpen: (p: PublicProduct) => void; embedded?: boolean }) {
  return (
    <ItemButton product={product} onOpen={onOpen} tone="light" className={embedded ? 'block pb-5' : 'grid gap-6 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] sm:items-end sm:gap-8 lg:block'}>
      <Photo product={product} width={960} tone="light" view={view} sizes="(min-width:1024px) 40vw, 100vw" className={`aspect-[4/5] rounded-[24px] ${embedded ? '' : 'lg:rounded-[28px]'}`} />
      <span className={`block ${embedded ? 'mt-4' : 'lg:hidden'}`}>
        <Meta product={product} number={number} tone="light" />
        <Name tone="light" className={embedded ? 'mt-1.5 text-[28px] leading-[1.02]' : 'mt-2 text-[34px] leading-[1.02] sm:text-[40px]'}>
          {product.name}
        </Name>
        {product.description && (
          <span className="mt-3 block max-w-[46ch] text-[15.5px] leading-relaxed" style={{ color: sb.muted }}>
            {product.description}
          </span>
        )}
        <span className="mt-5 block">
          <Ladder product={product} tone="light" size={embedded ? 'sm' : 'lg'} />
        </span>
      </span>
    </ItemButton>
  )
}

function FeatureLayout({ products, n, view, onOpen }: LayoutProps) {
  const [lead, ...rest] = products
  if (!lead) return null
  return (
    <div className="mt-10 grid gap-y-8 lg:mt-14 lg:grid-cols-12 lg:gap-x-6">
      <div className="lg:col-span-5">
        <Feature product={lead} number={n(lead)} view={view} onOpen={onOpen} />
      </div>
      <div className="flex flex-col lg:col-span-6 lg:col-start-7">
        {/* texto do destaque no desktop (no celular ele fica sob a foto) */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => onOpen(lead)}
          className="group hidden text-left outline-none lg:block"
        >
          <Meta product={lead} number={n(lead)} tone="light" />
          <Name tone="light" className="mt-3 text-[clamp(44px,4.4vw,68px)] leading-[0.96]">
            {lead.name}
          </Name>
          {lead.description && (
            <span className="mt-5 block max-w-[44ch] text-[18px] leading-relaxed" style={{ color: sb.muted }}>
              {lead.description}
            </span>
          )}
          <span className="mt-8 block">
            <Ladder product={lead} tone="light" size="lg" />
          </span>
        </button>
        <ul className="grid lg:mt-auto lg:pt-12">
          {rest.map((p) => (
            <li key={p.id} className="border-t" style={{ borderColor: sb.line }}>
              <Row product={p} number={n(p)} tone="light" view={view} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TriptychLayout({ products, n, view, onOpen }: LayoutProps) {
  return (
    <>
      <ul className="mt-6 lg:hidden">
        {products.map((p, i) => (
          <li key={p.id} className={i ? 'border-t' : ''} style={{ borderColor: sb.line }}>
            <Row product={p} number={n(p)} tone="light" view={view} onOpen={onOpen} flip />
          </li>
        ))}
      </ul>
      <ul className="mt-14 hidden grid-cols-3 gap-x-8 lg:grid">
        {products.map((p, i) => (
          <li key={p.id} className={i % 3 === 1 ? 'lg:pt-20' : i % 3 === 2 ? 'lg:pt-8' : ''}>
            <ItemButton product={p} onOpen={onOpen} tone="light" className="block">
              <Photo product={p} width={960} tone="light" view={view} sizes="33vw" className="aspect-[4/5] rounded-[22px]" />
              <span className="mt-5 block">
                <Meta product={p} number={n(p)} tone="light" />
                <Name tone="light" className="mt-1.5 text-[24px] leading-[1.05] lg:text-[32px]">
                  {p.name}
                </Name>
                {p.description && (
                  <span className="mt-2 line-clamp-3 block text-[15px] leading-snug" style={{ color: sb.muted }}>
                    {p.description}
                  </span>
                )}
                <span className="mt-4 block">
                  <Ladder product={p} tone="light" size="lg" />
                </span>
              </span>
            </ItemButton>
          </li>
        ))}
      </ul>
    </>
  )
}

function ArchesLayout({ products, n, view, onOpen }: LayoutProps) {
  return (
    <>
      <ul className="mt-6 lg:hidden">
        {products.map((p, i) => (
          <li key={p.id} className={i ? 'border-t' : ''} style={{ borderColor: 'rgba(242,240,235,.16)' }}>
            <Row product={p} number={n(p)} tone="dark" view={view} onOpen={onOpen} arch />
          </li>
        ))}
      </ul>
      <ul className="mt-16 hidden grid-cols-3 gap-x-10 lg:grid xl:gap-x-12">
        {products.map((p) => (
          <li key={p.id}>
            <ItemButton product={p} onOpen={onOpen} tone="dark" className="block text-center">
              <Photo product={p} width={960} tone="dark" view={view} sizes="33vw" className="mx-auto aspect-[4/5] w-full max-w-[380px] rounded-t-full rounded-b-[22px]" />
              <span className="mt-6 block">
                <Meta product={p} number={n(p)} tone="dark" />
                <Name tone="dark" className="mx-auto mt-1.5 text-[24px] leading-[1.05] lg:text-[32px]">
                  {p.name}
                </Name>
                {p.description && (
                  <span className="mx-auto mt-2 line-clamp-3 block max-w-[34ch] text-[15px] leading-snug" style={{ color: 'rgba(242,240,235,.72)' }}>
                    {p.description}
                  </span>
                )}
                <span className="mt-4 block">
                  <Ladder product={p} tone="dark" size="lg" center />
                </span>
              </span>
            </ItemButton>
          </li>
        ))}
      </ul>
    </>
  )
}

function ListLayout({ products, n, view, onOpen }: LayoutProps) {
  const [hover, setHover] = useState(0)
  const shown = products[hover] ?? products[0]
  return (
    <div className="mt-8 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-x-6">
      <ul className="lg:col-span-7">
        {products.map((p, i) => {
          const off = !p.is_available
          return (
            <li key={p.id} className="border-b first:border-t" style={{ borderColor: sb.line }} onMouseEnter={() => setHover(i)} onFocusCapture={() => setHover(i)}>
              <ItemButton product={p} onOpen={onOpen} tone="light" className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4 py-5 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[minmax(0,1fr)] lg:py-7">
                <Photo product={p} width={240} tone="light" view={view} className="aspect-[4/5] rounded-[14px] lg:hidden" />
                <span className="min-w-0">
                  <Meta product={p} number={n(p)} tone="light" />
                  <span className="mt-1 flex items-baseline gap-3">
                    <Name tone="light" className="min-w-0 text-[22px] leading-[1.08] sm:text-[28px] lg:text-[36px]">
                      {p.name}
                    </Name>
                    <span aria-hidden className="mb-[0.35em] hidden min-w-6 flex-1 border-b border-dotted sm:block" style={{ borderColor: '#b8b0a2' }} />
                    <span className="hidden shrink-0 text-[24px] tabular-nums sm:block lg:text-[28px]" style={{ ...display(), color: off ? '#8a8279' : sb.green, fontWeight: 500 }}>
                      {formatBRL(p.price)}
                    </span>
                  </span>
                  {p.description && (
                    <span className="mt-1.5 line-clamp-2 block max-w-[52ch] text-[14px] leading-snug sm:text-[15.5px]" style={{ color: sb.muted }}>
                      {p.description}
                    </span>
                  )}
                  <span className="mt-2 block text-[17px] tabular-nums sm:hidden" style={{ ...display(), color: off ? '#8a8279' : sb.green, fontWeight: 500 }}>
                    {formatBRL(p.price)}
                  </span>
                </span>
              </ItemButton>
            </li>
          )
        })}
      </ul>
      {/* prévia da foto do item sob o cursor (só desktop; no celular cada linha já tem a foto) */}
      <div aria-hidden className="hidden lg:col-span-4 lg:col-start-9 lg:block">
        <div className="sticky top-32">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]" style={{ background: '#e4ddd0' }}>
            <AnimatePresence initial={false}>
              {shown && (
                <motion.img
                  key={shown.id}
                  src={productImage(shown.image_path, 960) ?? ''}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={view.animate ? { opacity: 0, scale: 1.06 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease }}
                  style={{ filter: shown.is_available ? undefined : 'grayscale(1)' }}
                />
              )}
            </AnimatePresence>
          </div>
          <p className="mt-4 flex items-center justify-between text-[13px]" style={{ color: sb.muted }}>
            <span style={{ ...label, letterSpacing: '0.12em', color: sb.accent }}>{numLabel(shown ? n(shown) : undefined)}</span>
            <span className="inline-flex items-center gap-1">
              {shown?.name} <ArrowUpRight className="size-3.5" />
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ====================================================== acesso rápido e destaques */

/** Faixa logo abaixo da abertura: as quatro categorias com foto, contagem e preço inicial. */
export function CategoryStrip({
  groups,
  embedded,
  onGo,
}: {
  groups: Array<{ category: PublicCategory; products: PublicProduct[] }>
  embedded?: boolean
  onGo: (id: string) => void
}) {
  return (
    <nav aria-label="Categorias do cardápio" className={`${wrapClass(embedded)} ${embedded ? 'pt-5' : 'pt-6 sm:pt-8'}`}>
      <ol className={`grid gap-2 ${embedded ? 'grid-cols-2' : 'grid-cols-2 sm:gap-3 lg:grid-cols-4'}`}>
        {groups.map(({ category, products }, i) => {
          const from = products.length ? Math.min(...products.map(priceFrom)) : null
          return (
            <li key={category.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onGo(category.id)}
                className="group flex w-full items-center gap-3 rounded-[18px] p-2 pr-3 text-left transition-colors duration-300 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#00754A] sm:gap-4 sm:p-2.5"
                style={{ background: sb.paper, boxShadow: `inset 0 0 0 1px ${sb.line}` }}
              >
                <span className="relative aspect-[4/5] w-10 shrink-0 overflow-hidden rounded-[10px] sm:w-16 sm:rounded-[12px]" style={{ background: '#e4ddd0' }}>
                  {products[0] && (
                    <img
                      src={productImage(products[0].image_path, 200) ?? ''}
                      alt=""
                      width={96}
                      height={120}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-[10.5px] tabular-nums" style={{ ...label, letterSpacing: '0.12em', color: sb.accent }}>
                    {String(i + 1).padStart(2, '0')} · {products.length} itens
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[15px] leading-[1.1] sm:truncate sm:text-[20px]" style={{ ...display(), color: sb.house }}>
                    {category.name}
                  </span>
                  {from !== null && (
                    <span className="mt-0.5 hidden truncate text-[12.5px] tabular-nums sm:block" style={{ color: sb.muted }}>
                      a partir de {formatBRL(from)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Destaques escolhidos pelo restaurante (is_featured). No celular, uma fileira que rola de lado. */
export function Featured({
  products,
  numberOf,
  categoryName,
  embedded,
  view,
  onOpen,
}: {
  products: PublicProduct[]
  numberOf: Map<string, number>
  categoryName: Record<string, string>
  embedded?: boolean
  view: ViewOpts
  onOpen: (p: PublicProduct) => void
}) {
  if (!products.length) return null
  return (
    <section aria-labelledby="sb-featured" className={embedded ? 'pt-8' : 'pt-12 lg:pt-16'}>
      <div className={`${wrapClass(embedded)} flex items-end justify-between gap-4`}>
        <h2 id="sb-featured" className={embedded ? 'text-[28px] leading-none' : 'text-[34px] leading-none sm:text-[44px]'} style={{ ...display(), color: sb.house, letterSpacing: '-0.03em' }}>
          Destaques <em style={{ color: sb.green }}>da casa</em>
        </h2>
        <p className="hidden text-[13px] sm:block" style={{ color: sb.muted }}>
          Toque para ver tamanhos e preços
        </p>
      </div>
      <ul
        className={`no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 ${
          embedded ? 'scroll-px-4 px-4' : 'scroll-px-5 px-5 sm:scroll-px-8 sm:px-8 lg:mx-auto lg:grid lg:max-w-[1320px] lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-10'
        }`}
      >
        {products.map((p) => (
          <li key={p.id} className={`shrink-0 snap-start ${embedded ? 'w-[82%]' : 'w-[80%] min-[520px]:w-[52%] lg:w-auto'}`}>
            <ItemButton product={p} onOpen={onOpen} tone="light" className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3.5 rounded-[20px] bg-[#faf8f4] p-2 pr-3 shadow-[inset_0_0_0_1px_#ddd7cb] lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-5 lg:bg-transparent lg:p-0 lg:shadow-none">
              <Photo product={p} width={480} tone="light" view={view} className="aspect-[4/5] rounded-[14px] lg:rounded-[20px]" />
              <span className="min-w-0">
                <span className="block text-[10.5px]" style={{ ...label, letterSpacing: '0.12em', color: sb.accent }}>
                  {numLabel(numberOf.get(p.id))} · {categoryName[p.category_id] ?? ''}
                </span>
                <Name tone="light" className="mt-1 text-[19px] leading-[1.08] lg:text-[26px]">
                  {p.name}
                </Name>
                <span className="mt-1.5 block text-[15px] tabular-nums" style={{ ...display(), color: p.is_available ? sb.green : '#8a8279', fontWeight: 500 }}>
                  {p.variants?.length ? `a partir de ${formatBRL(priceFrom(p))}` : formatBRL(p.price)}
                  {!p.is_available && <span className="ml-2 text-[12px]" style={{ color: sb.brown }}>· Indisponível hoje</span>}
                </span>
              </span>
            </ItemButton>
          </li>
        ))}
      </ul>
    </section>
  )
}

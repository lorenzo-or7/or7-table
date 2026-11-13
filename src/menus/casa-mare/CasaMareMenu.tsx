/**
 * Casa Maré — cardápio exclusivo da demonstração (restaurante fictício).
 * Identidade própria, sem relação visual com a marca Or7 Table:
 * areia + tinta marinha + coral, Gambetta (títulos) e Switzer (texto),
 * linha de maré como assinatura gráfica.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AtSign, Clock, MapPin, X } from 'lucide-react'
import { groupByCategory, productImage, type MenuThemeProps, type PublicProduct } from '@/lib/public-menu'
import { formatPriceShort } from '@/lib/format'
import { useFontshare } from '../useFontshare'
import { usePageChrome } from '../hooks'
import { Or7Signature } from '@/components/brand/Logo'

const palette = {
  sand: '#F3EADB',
  sandDeep: '#E8DCC6',
  ink: '#10302E',
  inkSoft: '#3E5A57',
  coral: '#D9472B',
  foam: '#FBF7F0',
}

const serif = "'Gambetta', 'Iowan Old Style', Georgia, serif"
const sans = "'Switzer', ui-sans-serif, system-ui, sans-serif"

function Tide({ className, animate = true }: { className?: string; animate?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 240 12" className={className} aria-hidden preserveAspectRatio="none">
      <motion.path
        d="M0 6 C 20 0, 40 0, 60 6 S 100 12, 120 6 S 160 0, 180 6 S 220 12, 240 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        initial={animate && !reduce ? { pathLength: 0 } : false}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}

function updatedLabel(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  const today = new Date()
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Atualizado hoje, ${time}`
  return `Atualizado em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
}

export default function CasaMareMenu({ menu, isDemoData, embedded, lite }: MenuThemeProps) {
  useFontshare('f[]=gambetta@400,500,600,400i,500i&f[]=switzer@400,500,600')
  usePageChrome(!embedded, { track: palette.sand, thumb: '#C9B99D', hover: palette.coral, themeColor: palette.ink })
  const reduce = useReducedMotion()
  const groups = useMemo(() => groupByCategory(menu), [menu])
  const [active, setActive] = useState(groups[0]?.category.id ?? '')
  const [selected, setSelected] = useState<PublicProduct | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef(new Map<string, HTMLElement>())
  const chipsRef = useRef<HTMLDivElement>(null)
  const lockSpy = useRef(false)
  const { establishment: est } = menu
  const cover = productImage(menu.products.find((p) => p.image_path)?.image_path ?? null, 1400)

  // scroll-spy: categoria ativa acompanha a leitura
  useEffect(() => {
    if (lite) return
    const root = embedded ? scrollRef.current : null
    const io = new IntersectionObserver(
      (entries) => {
        if (lockSpy.current) return
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const id = visible[0]?.target.getAttribute('data-category')
        if (id) setActive(id)
      },
      { root, rootMargin: '-30% 0px -60% 0px' },
    )
    sectionRefs.current.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [embedded, groups, lite])

  // mantém o chip ativo visível na barra
  useEffect(() => {
    const bar = chipsRef.current
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
    if (bar && chip) {
      bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' })
    }
  }, [active, reduce])

  const goTo = (id: string) => {
    setActive(id)
    const el = sectionRefs.current.get(id)
    if (!el) return
    lockSpy.current = true
    window.setTimeout(() => (lockSpy.current = false), 700)
    const behavior = reduce ? 'auto' : 'smooth'
    if (embedded && scrollRef.current) {
      const box = scrollRef.current
      const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 52
      box.scrollTo({ top, behavior })
    } else {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior })
    }
  }

  const rootStyle: CSSProperties = { background: palette.sand, color: palette.ink, fontFamily: sans }
  const overlay = embedded ? 'absolute' : 'fixed'
  const updated = updatedLabel(est.updated_at)

  return (
    <div className="relative h-full" style={rootStyle}>
      <div
        ref={scrollRef}
        className={embedded ? 'no-scrollbar h-full overflow-y-auto overscroll-contain' : 'min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'}
      >
        {/* Capa */}
        <header
          className={
            embedded
              ? 'relative'
              : 'relative lg:sticky lg:top-0 lg:h-dvh lg:overflow-hidden'
          }
        >
          <div className={embedded ? 'relative h-[248px]' : 'relative h-[330px] sm:h-[400px] lg:h-full'}>
            {cover && (
              <motion.img
                src={cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={reduce || lite ? false : { scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, rgba(16,48,46,.15) 0%, rgba(16,48,46,.35) 45%, ${palette.ink} 100%)` }}
            />
            {(isDemoData || est.slug === 'demo') && (
              <span
                className={`absolute left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ${embedded ? 'top-11' : 'top-3'}`}
                style={{ background: palette.foam, color: palette.ink }}
              >
                Demonstração · dados fictícios
              </span>
            )}
            <div className={embedded ? 'absolute inset-x-5 bottom-5' : 'absolute inset-x-6 bottom-7 lg:inset-x-12 lg:bottom-14'}>
              <p className="text-[11px] font-medium tracking-[0.24em] uppercase" style={{ color: palette.sandDeep }}>
                Cozinha do litoral
              </p>
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={embedded ? 'mt-1 text-[44px] leading-none' : 'mt-2 text-[56px] leading-[0.95] lg:text-[88px]'}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, color: palette.foam }}
              >
                {est.name}
              </motion.h1>
              {est.tagline && (
                <p
                  className={embedded ? 'mt-2 max-w-[230px] text-[13px] leading-snug' : 'mt-3 max-w-sm text-[15px] leading-relaxed lg:text-lg'}
                  style={{ color: palette.sandDeep }}
                >
                  {est.tagline}
                </p>
              )}
              <Tide className={embedded ? 'mt-4 h-2.5 w-28' : 'mt-5 h-3 w-40'} />
              {!embedded && (
                <dl className="mt-6 hidden gap-2 text-sm lg:grid" style={{ color: palette.sandDeep }}>
                  {est.opening_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" aria-hidden /> <dt className="sr-only">Horário</dt>
                      <dd>{est.opening_hours}</dd>
                    </div>
                  )}
                  {est.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" aria-hidden /> <dt className="sr-only">Endereço</dt>
                      <dd>{est.address}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        </header>

        <main className="relative">
          {/* Navegação por categorias */}
          <nav
            aria-label="Categorias"
            className="sticky top-0 z-20 border-b backdrop-blur-md"
            style={{ background: 'rgba(243,234,219,.92)', borderColor: 'rgba(16,48,46,.1)' }}
          >
            <div ref={chipsRef} className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2.5 lg:px-10">
              {groups.map(({ category }) => {
                const isActive = category.id === active
                return (
                  <button
                    key={category.id}
                    data-chip={category.id}
                    type="button"
                    onClick={() => goTo(category.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className="relative shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors"
                    style={{ color: isActive ? palette.foam : palette.inkSoft }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={`cm-chip-${embedded ? 'e' : 'p'}`}
                        className="absolute inset-0 rounded-full"
                        style={{ background: palette.ink }}
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span className="relative">{category.name}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {!embedded && updated && (
            <p className="px-6 pt-6 text-xs lg:px-12" style={{ color: palette.inkSoft }}>
              {updated}
            </p>
          )}

          {groups.length === 0 && (
            <p className="px-6 py-20 text-center" style={{ fontFamily: serif, fontSize: 22, fontStyle: 'italic' }}>
              O cardápio está sendo preparado.
            </p>
          )}

          {groups.map(({ category, products }, gi) => (
            <section
              key={category.id}
              data-category={category.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(category.id, el)
                else sectionRefs.current.delete(category.id)
              }}
              aria-labelledby={`cm-h-${category.id}`}
              className={embedded ? 'px-4 pt-7 pb-2' : 'px-5 pt-10 pb-2 sm:px-8 lg:px-12'}
            >
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-[11px] font-semibold tabular-nums tracking-[0.2em]" style={{ color: palette.coral }}>
                  {String(gi + 1).padStart(2, '0')}
                </span>
                <h2
                  id={`cm-h-${category.id}`}
                  className={embedded ? 'text-[26px] leading-none' : 'text-[32px] leading-none lg:text-[40px]'}
                  style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500 }}
                >
                  {category.name}
                </h2>
              </div>
              <ul className={embedded ? 'grid gap-1' : 'grid gap-1 xl:grid-cols-2 xl:gap-x-6'}>
                {products.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={reduce || lite ? false : { opacity: 0, y: 14 }}
                    whileInView={lite ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, root: embedded ? scrollRef : undefined, margin: '0px 0px -40px 0px' }}
                    transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.2), ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ProductRow product={p} embedded={embedded} onOpen={() => setSelected(p)} />
                  </motion.li>
                ))}
              </ul>
            </section>
          ))}

          <footer className={embedded ? 'mt-8 px-5 pt-8 pb-10' : 'mt-14 px-6 pt-10 pb-14 lg:px-12'} style={{ background: palette.ink, color: palette.sandDeep }}>
            <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: embedded ? 26 : 32, color: palette.foam }}>{est.name}</p>
            <Tide className="mt-3 h-2.5 w-24 text-[#D9472B]" />
            <ul className="mt-5 grid gap-2.5 text-[13px]">
              {est.opening_hours && (
                <li className="flex items-center gap-2.5">
                  <Clock className="size-4 shrink-0" aria-hidden /> {est.opening_hours}
                </li>
              )}
              {est.address && (
                <li className="flex items-center gap-2.5">
                  <MapPin className="size-4 shrink-0" aria-hidden /> {est.address}
                </li>
              )}
              {est.instagram && (
                <li className="flex items-center gap-2.5">
                  <AtSign className="size-4 shrink-0" aria-hidden /> {est.instagram.replace(/^@/, '')}
                </li>
              )}
            </ul>
            <p className="mt-8 border-t pt-4 text-[11px] tracking-wide" style={{ borderColor: 'rgba(232,220,198,.15)', color: 'rgba(232,220,198,.6)' }}>
              Preços em reais. Cardápio digital por Or7 Table.
            </p>
            <Or7Signature className="mt-5 w-[180px] opacity-70" />
          </footer>
        </main>
      </div>

      {/* Detalhes do produto */}
      <AnimatePresence>
        {selected && (
          <ProductSheet
            key={selected.id}
            product={selected}
            position={overlay}
            embedded={embedded}
            category={menu.categories.find((c) => c.id === selected.category_id)?.name}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductRow({ product: p, onOpen, embedded }: { product: PublicProduct; onOpen: () => void; embedded?: boolean }) {
  const img = productImage(p.image_path, 320)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-2xl py-3 text-left transition-colors duration-200 hover:bg-[rgba(16,48,46,.045)] focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-2"
      style={{ outlineColor: palette.coral, opacity: p.is_available ? 1 : 0.62 }}
      aria-label={`${p.name}, R$ ${formatPriceShort(p.price)}${p.is_available ? '' : ', esgotado hoje'}. Ver detalhes`}
    >
      <div className="min-w-0 flex-1">
        <h3
          className={embedded ? 'text-[17px] leading-tight' : 'text-[19px] leading-tight lg:text-[21px]'}
          style={{ fontFamily: serif, fontWeight: 500 }}
        >
          {p.name}
        </h3>
        {p.description && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug" style={{ color: palette.inkSoft }}>
            {p.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="text-[14px] font-semibold tabular-nums"
            style={{ color: p.is_available ? palette.coral : palette.inkSoft, textDecoration: p.is_available ? 'none' : 'line-through' }}
          >
            <span className="mr-0.5 text-[11px] font-medium">R$</span>
            {formatPriceShort(p.price)}
          </span>
          {!p.is_available && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase" style={{ background: palette.ink, color: palette.sand }}>
              Esgotado hoje
            </span>
          )}
        </div>
      </div>
      {img && (
        <div
          className={embedded ? 'size-[78px] shrink-0 overflow-hidden rounded-[14px]' : 'size-[92px] shrink-0 overflow-hidden rounded-[16px] lg:size-[104px]'}
          style={{ background: palette.sandDeep }}
        >
          <img
            src={img}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            style={{ filter: p.is_available ? 'none' : 'grayscale(1)' }}
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          />
        </div>
      )}
    </button>
  )
}

function ProductSheet({
  product: p,
  onClose,
  position,
  category,
  embedded,
}: {
  product: PublicProduct
  onClose: () => void
  position: 'absolute' | 'fixed'
  category?: string
  embedded?: boolean
}) {
  const reduce = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)
  const img = productImage(p.image_path, 1000)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <div className={`${position} inset-0 z-50 flex items-end justify-center ${embedded ? '' : 'sm:items-center sm:p-6'}`}>
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(16,48,46,.55)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
        drag={reduce ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose()
        }}
        initial={reduce ? { opacity: 0 } : { y: '100%' }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        exit={reduce ? { opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        className={`no-scrollbar relative max-h-[90%] w-full overflow-y-auto rounded-t-[28px] ${embedded ? '' : 'sm:max-h-[88dvh] sm:max-w-md sm:rounded-[28px]'}`}
        style={{ background: palette.foam, color: palette.ink, fontFamily: sans }}
      >
        <div className="absolute top-2.5 left-1/2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-white/70" aria-hidden />
        {img && (
          <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: palette.sandDeep }}>
            <motion.img
              src={img}
              alt={p.name}
              className="h-full w-full object-cover"
              style={{ filter: p.is_available ? 'none' : 'grayscale(1)' }}
              onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
              initial={reduce ? false : { scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes"
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full"
          style={{ background: 'rgba(251,247,240,.92)', color: palette.ink }}
        >
          <X className="size-5" />
        </button>
        <div className="px-6 pt-5 pb-8">
          {category && (
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: palette.coral }}>
              {category}
            </p>
          )}
          <h3 className="mt-1.5 text-[28px] leading-tight" style={{ fontFamily: serif, fontWeight: 500 }}>
            {p.name}
          </h3>
          <Tide className="mt-3 h-2 w-20 text-[#D9472B]" />
          {p.description && (
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: palette.inkSoft }}>
              {p.description}
            </p>
          )}
          <div className="mt-6 flex items-center justify-between border-t pt-5" style={{ borderColor: 'rgba(16,48,46,.12)' }}>
            <span className="text-[26px] font-semibold tabular-nums" style={{ color: p.is_available ? palette.ink : palette.inkSoft }}>
              <span className="mr-1 text-sm font-medium">R$</span>
              {formatPriceShort(p.price)}
            </span>
            <span
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={p.is_available ? { background: 'rgba(16,48,46,.08)', color: palette.ink } : { background: palette.ink, color: palette.sand }}
            >
              {p.is_available ? 'Disponível' : 'Esgotado hoje'}
            </span>
          </div>
        </div>
      </motion.article>
    </div>
  )
}

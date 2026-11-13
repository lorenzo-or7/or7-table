/**
 * Detalhe do produto. Desktop: foto protagonista à esquerda e ficha editorial à direita, com navegação
 * para o item anterior/seguinte. Celular: bottom sheet com alça de arrastar, fechar sempre visível e
 * respiro da área segura. Sem pedidos nem checkout: é só consulta.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { productImage, type PublicProduct } from '@/lib/public-menu'
import { formatBRL } from '@/lib/format'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { numLabel } from './Catalog'
import { SIZE_GUIDE } from './Guides'
import { display, label, sans, sb, SIREN } from './tokens'

const mlOf = (labelText: string) => SIZE_GUIDE.find((s) => s.label === labelText)?.ml

function MiniCup({ h }: { h: number }) {
  return (
    <svg viewBox="0 0 24 32" height={h} width={(h * 24) / 32} aria-hidden>
      <path d="M4.6 8.5 L6.8 30 H17.2 L19.4 8.5 Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="3" y="5" width="18" height="3.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="18.5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

type Neighbor = { name: string; go: () => void } | undefined

export function ProductDialog({
  product: p,
  number,
  category,
  embedded,
  prev,
  next,
  onClose,
  onSizeGuide,
}: {
  product: PublicProduct
  number?: number
  category?: string
  embedded?: boolean
  prev?: Neighbor
  next?: Neighbor
  onClose: () => void
  onSizeGuide?: () => void
}) {
  const reduce = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 900px)') && !embedded
  const variants = p.variants ?? []
  const defaultSize = Math.min(1, Math.max(0, variants.length - 1))
  const [sel, setSel] = useState({ id: p.id, size: defaultSize })
  // ao navegar para outro item, volta ao tamanho padrão (Grande quando houver)
  const size = sel.id === p.id ? sel.size : defaultSize
  const setSize = (n: number) => setSel({ id: p.id, size: n })
  const chosen = variants[size]
  const price = chosen ? chosen.price : p.price
  const dialogRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const radios = useRef<Array<HTMLButtonElement | null>>([])
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const off = !p.is_available
  const position = embedded ? 'absolute' : 'fixed'
  const drag = useDragControls()

  // foco inicial, Esc, rolagem travada e foco preso dentro do diálogo
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') return onCloseRef.current()
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]), [href], [tabindex="0"]')).filter((el) => !el.hasAttribute('disabled'))
      if (!items.length) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    if (!embedded) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prevFocus?.focus?.({ preventScroll: true })
    }
  }, [embedded])

  // item seguinte/anterior: volta ao topo da ficha
  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 })
    dialogRef.current?.querySelector<HTMLElement>('[data-scroll]')?.scrollTo({ top: 0 })
  }, [p.id])

  const onRadioKey = (e: KeyboardEvent) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir || !variants.length) return
    e.preventDefault()
    const n = (size + dir + variants.length) % variants.length
    setSize(n)
    radios.current[n]?.focus()
  }

  const closeBtn = (
    <button
      ref={closeRef}
      type="button"
      onClick={onClose}
      aria-label="Fechar detalhes"
      className="grid size-11 place-items-center rounded-full border transition-[background-color,transform] duration-300 outline-none hover:rotate-90 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#00754A]"
      style={{ background: 'rgba(250,248,244,.94)', color: sb.house, borderColor: sb.line }}
    >
      <X className="size-5" aria-hidden />
    </button>
  )

  const sizes = variants.length > 0 && (
    <div className="mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <p id={`sz-${p.id}`} className="text-[12px]" style={{ ...label, color: sb.house }}>
          Escolha o tamanho
        </p>
        {onSizeGuide && (
          <button type="button" onClick={onSizeGuide} className="min-h-9 rounded text-[13px] font-semibold underline decoration-[#00754A]/40 underline-offset-4 outline-none hover:decoration-[#00754A] focus-visible:ring-2 focus-visible:ring-[#00754A]" style={{ color: sb.accent }}>
            Guia de tamanhos
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby={`sz-${p.id}`} onKeyDown={onRadioKey}>
        {variants.map((v, i) => {
          const on = i === size
          const ml = v.volume_ml ?? mlOf(v.label)
          return (
            <button
              key={v.label}
              ref={(el) => {
                radios.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${v.label}${ml ? `, ${ml} ml` : ''}, ${formatBRL(v.price)}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setSize(i)}
              className="relative flex min-h-[124px] flex-col items-start rounded-[18px] px-3.5 pt-3 pb-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#00754A] focus-visible:ring-offset-2 sm:px-4"
              style={{ color: on ? sb.cream : sb.house }}
            >
              {/* fundo do selecionado desliza entre as opções */}
              {on ? (
                <motion.span layoutId={`sb-size-${p.id}`} className="absolute inset-0 rounded-[18px]" style={{ background: sb.house }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }} />
              ) : (
                <span className="absolute inset-0 rounded-[18px] transition-colors duration-300 hover:bg-white" style={{ background: sb.paper, boxShadow: `inset 0 0 0 1px ${sb.line}` }} />
              )}
              <span className="pointer-events-none relative flex h-[34px] items-end" style={{ color: on ? sb.mint : sb.accent }}>
                <MiniCup h={22 + i * 6} />
              </span>
              <span className="pointer-events-none relative mt-2.5 text-[20px] leading-none" style={{ ...display(), fontStyle: on ? 'italic' : 'normal' }}>
                {v.label}
              </span>
              <span className="pointer-events-none relative mt-auto flex w-full flex-wrap items-end justify-between gap-x-1 pt-2 text-[12px] tabular-nums">
                <span style={{ ...label, letterSpacing: '0.06em', opacity: 0.72 }}>{ml ? `${ml} ml` : ''}</span>
                <span className="font-semibold">{formatBRL(v.price)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const priceBlock = (
    <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t pt-5 ${desktop ? 'mt-auto' : 'mt-8'}`} style={{ borderColor: sb.line }}>
      <div>
        <p className="text-[12px]" style={{ ...label, color: '#8f897e' }}>
          {chosen ? `${chosen.label}${chosen.volume_ml ?? mlOf(chosen.label) ? ` · ${chosen.volume_ml ?? mlOf(chosen.label)} ml` : ''}` : 'Preço'}
        </p>
        <p aria-live="polite" className="mt-1.5 text-[46px] leading-none tabular-nums" style={{ ...display(), color: off ? '#8a8279' : sb.green, fontWeight: 500, fontVariantNumeric: 'tabular-nums lining-nums' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={price} className="inline-block" initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }} transition={{ duration: 0.28 }}>
              {formatBRL(price)}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold" style={off ? { background: '#ece6dc', color: sb.brown } : { background: sb.mint, color: sb.house }}>
        <span className="size-1.5 rounded-full" style={{ background: off ? sb.brown : sb.green }} aria-hidden />
        {off ? 'Indisponível hoje' : 'Disponível'}
      </span>
    </div>
  )

  const neighbors = (prev || next) && (
    <nav aria-label="Outros itens" className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 text-[13px]" style={{ borderColor: sb.line, color: sb.muted }}>
      {prev ? (
        <button type="button" onClick={prev.go} className="group flex min-h-11 items-center gap-2 rounded text-left outline-none hover:text-[#1E3932] focus-visible:ring-2 focus-visible:ring-[#00754A]">
          <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <span className="truncate">
            <span className="sr-only">Anterior: </span>
            {prev.name}
          </span>
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button type="button" onClick={next.go} className="group flex min-h-11 items-center justify-end gap-2 rounded text-right outline-none hover:text-[#1E3932] focus-visible:ring-2 focus-visible:ring-[#00754A]">
          <span className="truncate">
            <span className="sr-only">Seguinte: </span>
            {next.name}
          </span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      )}
    </nav>
  )

  const head = (
    <>
      <p className="text-[12px]" style={{ ...label, color: sb.accent }}>
        {numLabel(number)}
        {category ? <span style={{ color: '#a39d92' }}> · {category}</span> : null}
      </p>
      <h3 className={`mt-3 ${desktop ? 'text-[clamp(44px,4.4vw,60px)]' : 'text-[38px]'} leading-[0.94]`} style={{ ...display(), color: sb.house, fontWeight: 400, letterSpacing: '-0.03em' }}>
        {p.name}
      </h3>
      {p.description && (
        <p className="mt-4 text-[16.5px] leading-relaxed" style={{ color: '#4f4a43' }}>
          {p.description}
        </p>
      )}
    </>
  )

  const footnote = (
    <p className="mt-4 text-[12px] leading-relaxed" style={{ color: '#7a7268' }}>
      Preços, tamanhos e disponibilidade ilustrativos. Demonstração conceitual não oficial.
    </p>
  )

  const img = (cls: string) => (
    <motion.img
      key={p.id}
      src={productImage(p.image_path, 960) ?? ''}
      alt={p.name}
      className={cls}
      style={{ filter: off ? 'grayscale(1)' : undefined }}
      initial={reduce ? false : { scale: 1.08, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    />
  )

  return (
    <div className={`${position} inset-0 z-50 flex justify-center ${desktop ? 'items-center p-6 lg:p-10' : 'items-end'}`}>
      <motion.div className="absolute inset-0" style={{ background: 'rgba(16,28,24,.62)', backdropFilter: 'blur(3px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
      {desktop ? (
        <motion.article
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`sb-dlg-${p.id}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="relative grid h-[min(88dvh,740px)] w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden rounded-[32px]"
          style={{ background: sb.cream, color: sb.ink, fontFamily: sans }}
        >
          <span id={`sb-dlg-${p.id}`} className="sr-only">
            {p.name}
          </span>
          <div className="relative overflow-hidden" style={{ background: '#e4ddd0' }}>
            {img('absolute inset-0 h-full w-full object-cover')}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(180deg, transparent, rgba(16,28,24,.55))' }} />
            <div className="absolute inset-x-6 bottom-6 flex items-center gap-3" style={{ color: sb.cream }}>
              <img src={SIREN} alt="" aria-hidden className="size-10 rounded-full" />
              <span className="text-[12px]" style={{ ...label, letterSpacing: '0.18em' }}>
                Starbucks{category ? ` · ${category}` : ''}
              </span>
            </div>
          </div>
          <div data-scroll className="no-scrollbar flex min-h-0 flex-col overflow-y-auto px-10 pt-8 pb-7 xl:px-12">
            <div className="mb-4 flex justify-end">{closeBtn}</div>
            {head}
            {sizes}
            {priceBlock}
            {footnote}
            {neighbors}
          </div>
        </motion.article>
      ) : (
        <motion.article
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`sb-dlg-${p.id}`}
          initial={reduce ? { opacity: 0 } : { y: '100%' }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          drag={reduce ? false : 'y'}
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 600) onClose()
          }}
          className="no-scrollbar relative w-full overflow-y-auto overscroll-contain rounded-t-[28px] sm:max-w-[560px]"
          style={{ background: sb.cream, color: sb.ink, fontFamily: sans, maxHeight: embedded ? '92%' : '92dvh' }}
        >
          <span id={`sb-dlg-${p.id}`} className="sr-only">
            {p.name}
          </span>
          <div className="sticky top-0 z-10 h-0">
            <div className="absolute top-3 right-3">{closeBtn}</div>
          </div>
          <div className="relative aspect-square max-h-[46dvh] w-full touch-none overflow-hidden" style={{ background: '#e4ddd0' }} onPointerDown={(e) => drag.start(e)}>
            {img('absolute inset-0 h-full w-full object-cover object-[50%_45%]')}
            <span className="absolute top-2.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/90 shadow-sm" aria-hidden />
          </div>
          <div className="px-5 pt-6" style={{ paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
            {head}
            {sizes}
            {priceBlock}
            {footnote}
            {neighbors}
          </div>
        </motion.article>
      )}
    </div>
  )
}

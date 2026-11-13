/**
 * Starbucks — demonstração conceitual NÃO OFICIAL do Or7 Table.
 * Direção "The Coffee Editorial": navbar creme com a sirene oficial e as categorias, abertura em verde
 * com fotografia e tipografia monumental, catálogo com uma composição por categoria, guias e campanhas.
 * Brygada 1918 + Bricolage Grotesque. Sem carrinho, pedidos ou checkout: é um cardápio para consulta.
 */
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { groupByCategory, type MenuThemeProps, type PublicProduct } from '@/lib/public-menu'
import { Or7Signature } from '@/components/brand/Logo'
import { useCategoryScroll, usePageChrome, useStylesheet } from '../hooks'
import { Hero } from './Hero'
import { CategorySection, CategoryStrip, Featured, type Layout } from './Catalog'
import { CampaignFrappuccino, CampaignMacchiato, CampaignRefresher } from './Campaigns'
import { CoffeeAnatomy, SizeGuide } from './Guides'
import { ProductDialog } from './ProductDialog'
import { ease, FONTS_URL, label, sans, sb, SIREN, wrapClass } from './tokens'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const intro: Record<string, string> = {
  'cafes quentes': 'Espresso, leite vaporizado e o tempo certo de xícara.',
  'cafes gelados': 'Os clássicos da casa, servidos com muito gelo.',
  frappuccinos: 'Batidos com gelo e cobertos de chantilly.',
  comidas: 'Para acompanhar o café, do salgado ao doce.',
}

const layoutOf: Record<string, Layout> = { 'cafes quentes': 'feature', 'cafes gelados': 'triptych', frappuccinos: 'arches', comidas: 'list' }
const FALLBACK: Layout[] = ['feature', 'triptych', 'arches', 'list']

export default function StarbucksMenu({ menu, isDemoData, embedded, lite }: MenuThemeProps) {
  useStylesheet(FONTS_URL)
  usePageChrome(!embedded, { track: sb.cream, thumb: '#b9c9c1', hover: sb.accent, themeColor: sb.cream })
  const reduce = Boolean(useReducedMotion())
  const groups = useMemo(() => groupByCategory(menu), [menu])
  const scrollRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const [navH, setNavH] = useState(72)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { active, goTo, register } = useCategoryScroll(
    groups.map((g) => g.category.id),
    { container: scrollRef, embedded, offset: navH + 16, disabled: lite },
  )
  const ordered = useMemo(() => groups.flatMap((g) => g.products), [groups])
  const byName = useMemo(() => Object.fromEntries(menu.products.map((p) => [p.name, p])), [menu.products])
  const catName = useMemo(() => Object.fromEntries(menu.categories.map((c) => [c.id, c.name])), [menu.categories])
  // numeração editorial contínua (Nº 01…12), na ordem do cardápio
  const numberOf = useMemo(() => new Map(ordered.map((p, i) => [p.id, i + 1])), [ordered])
  const showDemo = isDemoData || menu.establishment.slug === 'starbucks'
  const animate = !reduce && !lite
  const view = useMemo(() => ({ animate, root: embedded ? scrollRef : undefined }), [animate, embedded])

  const selectedIndex = selectedId ? ordered.findIndex((p) => p.id === selectedId) : -1
  const selected = selectedIndex >= 0 ? ordered[selectedIndex] : undefined
  const open = (p: PublicProduct) => setSelectedId(p.id)
  const neighbor = (i: number) => {
    const p = ordered[i]
    return p ? { name: p.name, go: () => setSelectedId(p.id) } : undefined
  }

  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setNavH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const bar = chipsRef.current
    const chip = bar?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
    if (bar && chip) bar.scrollTo({ left: chip.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' })
  }, [active, reduce])

  const toTop = () => (embedded ? scrollRef.current : window)?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  const toSizeGuide = embedded ? undefined : () => document.getElementById('guia-tamanhos')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })

  return (
    <div className="relative h-full" style={{ background: sb.cream, color: sb.ink, fontFamily: sans }}>
      <div ref={scrollRef} className={embedded ? 'no-scrollbar h-full overflow-y-auto overscroll-contain' : 'min-h-dvh'}>
        {/* ================================================================ NAVBAR */}
        <header ref={navRef} className="sticky top-0 z-40 border-b" style={{ background: 'rgba(242,240,235,.94)', borderColor: sb.line, backdropFilter: 'saturate(1.4) blur(12px)', WebkitBackdropFilter: 'saturate(1.4) blur(12px)' }}>
          <div className={`flex items-center justify-between gap-6 ${embedded ? 'px-4 pt-10 pb-2' : `${wrapClass()} py-2.5 lg:py-3`}`}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                toTop()
              }}
              aria-label="Starbucks, voltar ao topo"
              className="flex shrink-0 items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#00754A]"
            >
              <img src={SIREN} width={237} height={240} alt="" className={embedded ? 'size-9' : 'size-10 lg:size-11'} />
              <span className="leading-none">
                <span className="block text-[14px]" style={{ ...label, letterSpacing: '0.2em', fontWeight: 700, color: sb.house }}>
                  Starbucks
                </span>
                <span className="mt-1 block text-[12px]" style={{ color: sb.muted }}>
                  Cardápio
                </span>
              </span>
            </a>
            {!embedded && (
              <nav aria-label="Categorias" className="hidden lg:block">
                <ul className="flex items-center gap-1 rounded-full p-1" style={{ boxShadow: `inset 0 0 0 1px ${sb.line}`, background: sb.paper }}>
                  {groups.map(({ category }, i) => {
                    const on = category.id === active
                    return (
                      <li key={category.id}>
                        <button
                          type="button"
                          onClick={() => goTo(category.id)}
                          aria-current={on ? 'true' : undefined}
                          className="relative flex min-h-10 items-center gap-2 rounded-full px-4 text-[14.5px] font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#00754A]"
                          style={{ color: on ? sb.cream : sb.house }}
                        >
                          {on && <motion.span layoutId="sb-nav-pill" className="absolute inset-0 rounded-full" style={{ background: sb.house }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }} />}
                          <span className="relative text-[10px] tabular-nums" style={{ ...label, letterSpacing: '0.06em', color: on ? sb.mint : '#a39d92' }}>
                            0{i + 1}
                          </span>
                          <span className="relative">{category.name}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            )}
            {showDemo && (
              <span className="shrink-0 rounded-full px-3 py-1.5 text-[11px]" style={{ ...label, letterSpacing: '0.1em', color: sb.brown, boxShadow: 'inset 0 0 0 1px rgba(92,64,51,.25)' }}>
                Demo não oficial
              </span>
            )}
          </div>
          <div ref={chipsRef} className={`no-scrollbar flex gap-1.5 overflow-x-auto pb-2.5 ${embedded ? 'px-4' : 'px-5 sm:px-8 lg:hidden'}`} role="navigation" aria-label="Categorias">
            {groups.map(({ category }) => {
              const on = category.id === active
              return (
                <button
                  key={category.id}
                  data-chip={category.id}
                  type="button"
                  onClick={() => goTo(category.id)}
                  aria-current={on ? 'true' : undefined}
                  className="relative min-h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#00754A] focus-visible:ring-offset-2"
                  style={{ color: on ? sb.cream : sb.house }}
                >
                  {on ? (
                    <motion.span layoutId={embedded ? 'sb-chip-pill-e' : 'sb-chip-pill'} className="absolute inset-0 rounded-full" style={{ background: sb.house }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }} />
                  ) : (
                    <span className="absolute inset-0 rounded-full" style={{ boxShadow: `inset 0 0 0 1px ${sb.line}`, background: sb.paper }} />
                  )}
                  <span className="relative">{category.name}</span>
                </button>
              )
            })}
          </div>
        </header>

        {/* ================================================================== HERO */}
        <Hero
          total={ordered.length}
          lead={byName['Iced Caramelo Macchiato'] ?? ordered[0]}
          leadNumber={numberOf.get((byName['Iced Caramelo Macchiato'] ?? ordered[0])?.id ?? '')}
          animate={animate}
          parallax={animate && !embedded}
          embedded={embedded}
          showDemo={showDemo}
          onStart={() => groups[0] && goTo(groups[0].category.id)}
          onOpen={open}
        />
        <CategoryStrip groups={groups} embedded={embedded} onGo={goTo} />
        <Featured products={ordered.filter((p) => p.is_featured)} numberOf={numberOf} categoryName={catName} embedded={embedded} view={view} onOpen={open} />

        {/* ============================================================== CARDÁPIO */}
        <main id="cardapio" className="relative [overflow-x:clip]">
          {groups.length === 0 && <p className="py-24 text-center text-lg">O cardápio está sendo preparado.</p>}
          {groups.map(({ category, products }, gi) => {
            const key = norm(category.name)
            const last = gi === groups.length - 1
            // o respiro fica fora do bloco registrado: a âncora para no topo da categoria
            return (
              <Fragment key={category.id}>
              <div aria-hidden className={embedded ? 'h-10' : 'h-14 lg:h-24'} />
              <div ref={register(category.id)} data-category={category.id}>
                <CategorySection
                  index={gi}
                  total={groups.length}
                  category={category}
                  products={products}
                  layout={layoutOf[key] ?? FALLBACK[gi % FALLBACK.length]!}
                  intro={intro[key]}
                  embedded={embedded}
                  numberOf={numberOf}
                  view={view}
                  onOpen={open}
                  onSizeGuide={toSizeGuide}
                />
                {!embedded && key === 'cafes gelados' && <CampaignMacchiato product={byName['Iced Caramelo Macchiato']} onOpen={open} animate={animate} />}
                {!embedded && key === 'frappuccinos' && <CampaignFrappuccino product={byName['Caramelo Frappuccino']} onOpen={open} animate={animate} />}
                {/* campanha da estação fecha o último bloco (mantém a categoria ativa na navegação) */}
                {!embedded && last && (
                  <motion.div className="mt-14 lg:mt-24" initial={animate ? { opacity: 0 } : false} whileInView={animate ? { opacity: 1 } : undefined} viewport={{ once: true }} transition={{ duration: 0.9, ease }}>
                    <CampaignRefresher animate={animate} />
                  </motion.div>
                )}
              </div>
              </Fragment>
            )
          })}
          {/* guias complementares: depois do catálogo, para não competir com os produtos */}
          {!embedded && groups.length > 0 && (
            <>
              <SizeGuide id="guia-tamanhos" />
              <CoffeeAnatomy />
              <div className="h-20 lg:h-28" aria-hidden />
            </>
          )}
          {embedded && <div className="h-10" aria-hidden />}
        </main>

        {/* ================================================================ RODAPÉ */}
        <footer style={{ background: sb.house, color: sb.cream }}>
          <div className={`grid gap-10 py-12 ${embedded ? 'px-5' : `${wrapClass()} md:grid-cols-[minmax(0,1fr)_auto] lg:py-16`}`}>
            <div>
              <div className="flex items-center gap-3">
                <img src={SIREN} width={237} height={240} alt="" loading="lazy" className="size-11 rounded-full" />
                <span className="text-[15px]" style={{ ...label, letterSpacing: '0.18em', fontWeight: 700 }}>
                  Starbucks
                </span>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
                {groups.map(({ category }) => (
                  <li key={category.id}>
                    <button type="button" onClick={() => goTo(category.id)} className="min-h-9 rounded opacity-80 underline-offset-4 transition-opacity outline-none hover:underline hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#D4E9E2]">
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-xl text-[13px] leading-relaxed opacity-70">
                Demonstração conceitual não oficial, criada para apresentar o Or7 Table. Sem vínculo, parceria ou autorização da Starbucks. Preços, tamanhos e
                disponibilidade são ilustrativos.
              </p>
            </div>
            <div className="flex flex-col items-start gap-6 md:items-end md:justify-between">
              {!embedded && (
                <Link to="/" className="inline-flex min-h-10 items-center gap-1.5 rounded text-[14px] font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#D4E9E2]" style={{ color: sb.mint }}>
                  Voltar ao Or7 Table <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              )}
              <Or7Signature className="w-[200px] opacity-75" />
            </div>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {selected && (
          <ProductDialog
            key="sb-dialog"
            product={selected}
            number={numberOf.get(selected.id)}
            category={catName[selected.category_id]}
            embedded={embedded}
            prev={neighbor(selectedIndex - 1)}
            next={neighbor(selectedIndex + 1)}
            onClose={() => setSelectedId(null)}
            onSizeGuide={
              embedded
                ? undefined
                : () => {
                    setSelectedId(null)
                    window.setTimeout(() => document.getElementById('guia-tamanhos')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 220)
                  }
            }
          />
        )}
      </AnimatePresence>
    </div>
  )
}

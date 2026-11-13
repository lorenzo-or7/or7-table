import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ArrowUpRight, Hand, Layers, PackageX } from 'lucide-react'
import { cn } from '@/components/ui/primitives'
import { OutlineButton } from '@/components/ui/cta'
import { fetchPublicMenu, type PublicMenu } from '@/lib/public-menu'
import { demoMenu } from '@/data/demo-menu'
import { laBrasaMenu } from '@/data/demo-la-brasa'
import { starbucksMenu } from '@/data/demo-starbucks'
import { DEMO_SLUG, LA_BRASA_SLUG, STARBUCKS_SLUG } from '@/lib/site'
import { Container, PhoneFrame, Reveal, SectionHeading } from './common'

const CasaMareMenu = lazy(() => import('@/menus/casa-mare/CasaMareMenu'))
const LaBrasaMenu = lazy(() => import('@/menus/la-brasa/LaBrasaMenu'))
const StarbucksMenu = lazy(() => import('@/menus/starbucks/StarbucksMenu'))

const demos = [
  { slug: DEMO_SLUG, name: 'Casa Maré', kind: 'Frutos do mar', fallback: demoMenu, Component: CasaMareMenu, swatch: ['#10302E', '#F3EADB', '#D9472B'] },
  { slug: LA_BRASA_SLUG, name: 'La Brasa', kind: 'Hamburgueria', fallback: laBrasaMenu, Component: LaBrasaMenu, swatch: ['#0E0C0A', '#F5B301', '#E8501E'] },
  { slug: STARBUCKS_SLUG, name: 'Starbucks', kind: 'Demo não oficial', fallback: starbucksMenu, Component: StarbucksMenu, swatch: ['#1E3932', '#F2F0EB', '#00754A'] },
] as const

const hints = [
  { icon: Layers, title: 'Troque de categoria', text: 'A barra no topo acompanha a rolagem e leva direto a cada seção.' },
  { icon: Hand, title: 'Abra um prato', text: 'Foto grande, descrição e preço. No La Brasa, deslize para ver outro ângulo.' },
  { icon: PackageX, title: 'Veja o que acabou', text: 'Itens esgotados aparecem sinalizados, sem sumir do cardápio.' },
]

/** Usa os dados reais do banco quando o Supabase está configurado; senão, o exemplo embutido. */
function useDemoData(slug: string, fallback: PublicMenu, enabled: boolean) {
  const [state, setState] = useState<{ menu: PublicMenu; fromDb: boolean }>({ menu: fallback, fromDb: false })
  useEffect(() => {
    if (!enabled) return
    let active = true
    setState({ menu: fallback, fromDb: false })
    fetchPublicMenu(slug)
      .then((m) => {
        if (active && m && m.products.length) setState({ menu: m, fromDb: true })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [slug, fallback, enabled])
  return state
}

export function DemoSection() {
  const [current, setCurrent] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  // o cardápio só monta quando a seção se aproxima da tela
  const near = useInView(stageRef, { once: true, margin: '600px 0px' })
  const demo = demos[current]!
  const { menu, fromDb } = useDemoData(demo.slug, demo.fallback, near)
  const Menu = demo.Component

  return (
    <section id="demonstracao" aria-labelledby="demo-title" className="relative overflow-hidden py-24 sm:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <div>
          <SectionHeading
            id="demo-title"
            align="left"
            eyebrow="Demonstração"
            title="Experimente o cardápio"
            accent="como seu cliente vê."
            description={
              <>
                Três cardápios demonstrativos, cada um com identidade própria. {fromDb ? 'Os dados vêm do mesmo sistema que o administrador usa para editar.' : 'Os produtos seguem a mesma estrutura que o administrador edita no painel.'}
              </>
            }
          />

          <Reveal delay={0.1}>
            <div role="tablist" aria-label="Cardápios demonstrativos" className="mt-9 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:max-w-lg">
              {demos.map((d, i) => {
                const on = i === current
                return (
                  <button
                    key={d.slug}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls="demo-phone"
                    onClick={() => setCurrent(i)}
                    className={cn(
                      'beam flex items-center gap-3 rounded-[4px] border p-3 text-left transition-colors',
                      on ? 'border-gold/40 bg-gold/[0.07]' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20',
                    )}
                  >
                    <span className="flex -space-x-1.5" aria-hidden>
                      {d.swatch.map((s) => (
                        <i key={s} className="size-5 rounded-full ring-2 ring-navy-950" style={{ background: s }} />
                      ))}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-cream">{d.name}</span>
                      <span className="block truncate text-xs text-dim">{d.kind}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Reveal>

          <ul className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-6">
            {hints.map((h, i) => (
              <li key={h.title}>
                <Reveal delay={0.08 * i} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/[0.04] text-gold">
                    <h.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-cream">{h.title}</p>
                    <p className="mt-1 text-[0.95rem] leading-relaxed text-mist">{h.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center gap-4">
            <OutlineButton href={`/table/${demo.slug}`} size="md" icon={<ArrowUpRight className="size-4" aria-hidden />}>
              Abrir {demo.name} em tela cheia
            </OutlineButton>
            <span className="text-sm text-dim">Demonstração. Preços e descrições ilustrativos.</span>
          </Reveal>
        </div>

        <Reveal y={40} className="relative mx-auto">
          <div ref={stageRef} aria-hidden className="absolute inset-[-12%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(255_170_0/0.16),transparent)] blur-2xl" />
          <PhoneFrame className="w-[min(330px,86vw)]" label={`Cardápio demonstrativo interativo: ${demo.name}`}>
            <div id="demo-phone" role="tabpanel" className="absolute inset-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={demo.slug}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  {near ? (
                    <Suspense fallback={<div className="h-full w-full bg-navy-950" />}>
                      <Menu menu={menu} isDemoData={!fromDb} embedded />
                    </Suspense>
                  ) : (
                    <div className="h-full w-full bg-navy-950" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </PhoneFrame>
        </Reveal>
      </Container>
    </section>
  )
}

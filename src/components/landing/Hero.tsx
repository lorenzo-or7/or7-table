import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'motion/react'
import {
  ArrowDownRight,
  Check,
  Images,
  LogOut,
  Package,
  Plus,
  Search,
  Tags,
  Eye,
} from 'lucide-react'
import { cn } from '@/components/ui/primitives'
import { EditorialButton, OutlineButton } from '@/components/ui/cta'
import { Logo } from '@/components/brand/Logo'
import { whatsappHref } from '@/lib/site'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { demoMenu } from '@/data/demo-menu'
import { formatBRL } from '@/lib/format'
import { productImage, type PublicMenu } from '@/lib/public-menu'
import CasaMareMenu from '@/menus/casa-mare/CasaMareMenu'
import { Eyebrow, PhoneFrame, WordReveal } from './common'

const SparklesCore = lazy(() => import('@/components/ui/sparkles'))

const ease = [0.22, 1, 0.36, 1] as const
const chips = [
  'QR Code permanente',
  'Preço alterado em segundos',
  'Fotos dos pratos',
  'Nada para baixar',
  'Design exclusivo para cada casa',
  'Abre em qualquer celular',
]

/**
 * Pequena história em loop: o proprietário muda um preço e marca um item
 * como esgotado no painel; o celular mostra a mudança logo depois.
 */
function useLiveStory(enabled: boolean) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const timings = [3200, 1400, 2600, 1400, 3400]
    let i = 0
    let t: number
    const tick = () => {
      t = window.setTimeout(() => {
        i = (i + 1) % timings.length
        setStep(i)
        tick()
      }, timings[i])
    }
    tick()
    return () => window.clearTimeout(t)
  }, [enabled])
  // 0: inicial · 1: editando preço · 2: preço salvo · 3: desligando item · 4: item esgotado
  return step
}

export function Hero() {
  const reduce = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start end', 'end start'] })
  const rotateX = useTransform(scrollYProgress, [0, 0.45], [reduce ? 0 : 22, 0])
  const scale = useTransform(scrollYProgress, [0, 0.45], [reduce ? 1 : 0.92, 1])
  const phoneY = useTransform(scrollYProgress, [0.1, 0.7], [reduce ? 0 : 60, reduce ? 0 : -40])

  const [storyOn, setStoryOn] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setStoryOn(!reduce), 2600)
    return () => window.clearTimeout(t)
  }, [reduce])
  // tudo que anima em loop na hero para quando ela sai da tela
  const sectionRef = useRef<HTMLElement>(null)
  const heroVisible = useInView(sectionRef, { margin: '-10% 0px 0px 0px' })
  const step = useLiveStory(storyOn && heroVisible)

  const priceSaved = step >= 2
  const oysterOff = step === 4
  const liveMenu: PublicMenu = useMemo(
    () => ({
      ...demoMenu,
      products: demoMenu.products.map((p, i) => {
        if (i === 0 && priceSaved) return { ...p, price: 62 }
        if (i === 1 && oysterOff) return { ...p, is_available: false }
        return p
      }),
    }),
    [priceSaved, oysterOff],
  )

  const desktop = useMediaQuery('(min-width: 768px)')
  const narrow = useMediaQuery('(max-width: 639px)')
  // partículas entram depois da primeira pintura, para não competir com a entrada da hero
  const [particles, setParticles] = useState(false)
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    if (w.requestIdleCallback) w.requestIdleCallback(() => setParticles(true), { timeout: 1500 })
    else window.setTimeout(() => setParticles(true), 900)
  }, [])

  return (
    <section ref={sectionRef} aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-abyss pt-32 sm:pt-40">
      {/* Atmosfera: navy profundo, luz dourada no horizonte, partículas */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,#151c4a_0%,#0b1029_45%,#050819_100%)]" />
        {/* brilhos como gradientes radiais (sem filtro de blur, que custa caro para compor) */}
        <div className="absolute top-[-14%] left-[-16%] h-[640px] w-[640px] bg-[radial-gradient(closest-side,rgb(255_0_30/0.09),transparent)]" />
        <div className="absolute top-[2%] right-[-14%] h-[580px] w-[580px] bg-[radial-gradient(closest-side,rgb(255_170_0/0.07),transparent)]" />
      </div>
      <div className="absolute inset-0 -z-10 h-[78%]">
        <Suspense fallback={null}>
          {particles && heroVisible && <SparklesCore className="h-full w-full" particleDensity={narrow ? 12 : 20} />}
        </Suspense>
        {/* esmaece as bordas com um gradiente por cima, em vez de máscara sobre o canvas animado */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,transparent_40%,#080c22_100%)]" />
      </div>

      <div className="relative mx-auto flex max-w-[1240px] flex-col items-center px-5 text-center sm:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease }}
        >
          <Eyebrow className="normal-case tracking-normal">
            <span className="font-sans text-[0.78rem] font-medium tracking-[0.01em] text-cream/85 sm:text-[0.82rem]">
              Cardápio digital com identidade própria
            </span>
          </Eyebrow>
        </motion.div>

        <h1 id="hero-title" className="display mt-7 max-w-[15ch] text-[3.5rem] text-cream sm:text-[5.6rem] lg:max-w-none lg:text-[8.4rem]">
          <WordReveal text="Seu cardápio merece" immediate delay={0.15} stagger={0.08} />
          <br />
          <WordReveal text="ser" immediate delay={0.42} />{' '}
          <motion.span
            className="inline-block text-gold"
            initial={reduce ? false : { opacity: 0, y: '0.3em', filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.55, ease }}
          >
            extraordinário.
          </motion.span>
        </h1>

        <motion.p
          className="mt-7 max-w-[38rem] text-[1.08rem] leading-relaxed text-mist sm:text-[1.2rem]"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease }}
        >
          Transforme seu cardápio em uma experiência digital. Atualize produtos, personalize sua apresentação e encante seus
          clientes com um simples QR Code.
        </motion.p>

        <motion.div
          className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease }}
        >
          <EditorialButton href={whatsappHref('demo')} className="w-full sm:w-auto">
            Solicitar demonstração
          </EditorialButton>
          <OutlineButton href="#demonstracao" className="w-full sm:w-auto" icon={<ArrowDownRight className="size-4" aria-hidden />}>
            Explorar demonstração
          </OutlineButton>
        </motion.div>

        {/* Faixa de capacidades reais */}
        <motion.div
          className="relative mt-14 w-full max-w-3xl overflow-hidden"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0a0f28] to-transparent" />
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0a0f28] to-transparent" />
          <ul
            className="animate-marquee flex w-max gap-3 will-change-transform hover:[animation-play-state:paused]"
            style={heroVisible ? undefined : { animationPlayState: 'paused' }}
            aria-label="Recursos"
          >
            {[...chips, ...chips].map((c, i) => (
              <li
                key={i}
                aria-hidden={i >= chips.length || undefined}
                className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm whitespace-nowrap text-mist"
              >
                <Check className="size-3.5 text-gold" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Palco: painel + celular */}
      <div ref={stageRef} className="relative mx-auto mt-16 max-w-[1240px] px-3 pb-16 sm:mt-20 sm:px-8 sm:pb-20 [perspective:1600px]">
        {/* horizonte de luz */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[-90px] -z-0 flex justify-center">
          <div className="h-[260px] w-[min(1100px,92vw)] rounded-[100%] bg-[radial-gradient(50%_50%_at_50%_100%,rgb(255_170_0/0.38),rgb(255_0_30/0.08)_55%,transparent_75%)] blur-2xl" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[-2px] flex justify-center">
          <div className="h-px w-[min(900px,80vw)] bg-gradient-to-r from-transparent via-gold-soft/80 to-transparent" />
        </div>

        <motion.div
          style={{ rotateX, scale, transformOrigin: 'center top' }}
          initial={reduce ? false : { opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.9, ease }}
          className="relative will-change-transform md:mr-[196px] lg:mr-[250px]"
        >
          <DashboardMockup step={step} />
        </motion.div>

        <motion.div
          style={{ y: phoneY }}
          initial={reduce ? false : { opacity: 0, x: 60, rotate: 4 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 1.1, delay: 1.35, ease }}
          className="pointer-events-none absolute right-2 bottom-10 z-10 hidden md:block sm:right-8 lg:bottom-14"
          aria-hidden
          inert
        >
          <PhoneFrame className="w-[248px] lg:w-[290px]">
            {desktop && <CasaMareMenu menu={liveMenu} embedded lite />}
          </PhoneFrame>
          <AnimatePresence>
            {(step === 2 || step === 4) && (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute -left-36 top-[30%] flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/95 px-3.5 py-2 text-xs text-cream shadow-xl"
              >
                <span className="size-1.5 rounded-full bg-mint" />
                Atualizado no cardápio
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-abyss" />
    </section>
  )
}

/** Representação do painel do proprietário — mesmos elementos da interface real. */
function DashboardMockup({ step }: { step: number }) {
  const items = demoMenu.products.slice(0, 6)
  const cats = Object.fromEntries(demoMenu.categories.map((c) => [c.id, c.name]))
  const editing = step === 1
  const saved = step >= 2
  const togglingOff = step >= 3

  return (
    <div
      className="relative overflow-hidden rounded-[22px] border border-white/[0.09] bg-navy-950/95 shadow-[0_60px_140px_-40px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.06)] sm:rounded-[28px]"
      aria-hidden
    >
      <div className="flex">
        {/* sidebar compacta */}
        <div className="hidden w-[64px] shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] py-5 sm:flex">
          <Logo variant="symbol" className="mb-4 w-7" />
          {[Package, Tags, Images, Eye].map((Icon, i) => (
            <span
              key={i}
              className={cn(
                'relative grid size-10 place-items-center rounded-xl',
                i === 0 ? 'bg-white/[0.07] text-gold' : 'text-dim',
              )}
            >
              {i === 0 && <span className="absolute top-2.5 bottom-2.5 left-[-12px] w-[3px] rounded-full bg-gold" />}
              <Icon className="size-[18px]" />
            </span>
          ))}
          <span className="mt-auto grid size-10 place-items-center text-dim">
            <LogOut className="size-[18px]" />
          </span>
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[11px] tracking-[0.18em] text-dim uppercase">Casa Maré</p>
              <p className="mt-1 text-xl font-semibold text-cream sm:text-2xl">
                Produtos <span className="hidden text-mist/50 sm:inline">· 16 itens</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-dim sm:flex">
                <Search className="size-4" /> Buscar produto
              </span>
              <span className="flex h-9 items-center gap-1.5 rounded-full bg-gold px-3.5 text-sm font-medium text-navy-950">
                <Plus className="size-4" /> <span className="hidden sm:inline">Novo produto</span>
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-hidden">
            {demoMenu.categories.map((c, i) => (
              <span
                key={c.id}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs whitespace-nowrap',
                  i === 0 ? 'border-gold/40 bg-gold/10 text-gold-soft' : 'border-white/[0.07] text-dim',
                )}
              >
                {c.name}
              </span>
            ))}
          </div>

          <ul className="mt-4 divide-y divide-white/[0.05] rounded-2xl border border-white/[0.06] bg-white/[0.015] text-left">
            {items.map((p, i) => {
              const isPriceRow = i === 0
              const isToggleRow = i === 1
              const available = isToggleRow ? !togglingOff : p.is_available
              const price = isPriceRow && saved ? 62 : p.price
              return (
                <li key={p.id} className={cn('flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4', i > 3 && 'hidden sm:flex')}>
                  <img src={productImage(p.image_path, 120) ?? ''} alt="" className="size-10 shrink-0 rounded-lg object-cover sm:size-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-cream sm:text-[0.95rem]">{p.name}</p>
                    <p className="truncate text-xs text-dim">{cats[p.category_id]}</p>
                  </div>
                  <div className="relative w-[96px] text-right sm:w-[120px]">
                    {isPriceRow && editing ? (
                      <span className="inline-flex h-8 items-center rounded-lg border border-gold/70 bg-navy-900 px-2.5 text-sm text-cream shadow-[0_0_0_3px_rgb(255_170_0/0.15)] tabular">
                        R$ 62,00
                        <span className="ml-0.5 h-4 w-px animate-pulse bg-gold" />
                      </span>
                    ) : (
                      <motion.span
                        key={price}
                        initial={isPriceRow && saved ? { color: '#FFC64D', y: -4 } : false}
                        animate={{ color: '#F6F1E7', y: 0 }}
                        transition={{ duration: 1.2 }}
                        className="text-sm tabular sm:text-[0.95rem]"
                      >
                        {formatBRL(price)}
                      </motion.span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'relative hidden h-6 w-10 shrink-0 rounded-full border transition-colors duration-300 sm:block',
                      available ? 'border-gold/60 bg-gold' : 'border-white/12 bg-white/[0.08]',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-[3px] size-4 rounded-full transition-all duration-300',
                        available ? 'left-[19px] bg-navy-950' : 'left-[3px] bg-mist',
                      )}
                    />
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex h-6 items-center text-left text-xs text-dim">
            <AnimatePresence mode="wait">
              {saved && (
                <motion.span
                  key={step >= 4 ? 'b' : 'a'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Check className="size-3.5 text-mint" />
                  {step >= 4 ? 'Ostras marcadas como esgotadas.' : 'Preço salvo. Já está no cardápio.'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

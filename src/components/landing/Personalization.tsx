import { useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { cn } from '@/components/ui/primitives'
import { demoMenu } from '@/data/demo-menu'
import { laBrasaMenu } from '@/data/demo-la-brasa'
import { productImage } from '@/lib/public-menu'
import { formatPriceShort } from '@/lib/format'
import { useStylesheet } from '@/menus/hooks'
import { Container, PhoneFrame, Reveal, SectionHeading } from './common'

const P = demoMenu.products
const img = (i: number, w = 500) => productImage(P[i]!.image_path, w) ?? ''

const concepts = [
  {
    key: 'mare',
    name: 'Casa Maré',
    kind: 'Frutos do mar · litoral',
    notes: 'Areia e tinta marinha, serifa itálica, linha de maré como assinatura. Rolagem contínua com categorias fixas no topo.',
    swatches: ['#10302E', '#F3EADB', '#D9472B'],
  },
  {
    key: 'brasa',
    name: 'La Brasa',
    kind: 'Hamburgueria · street burger',
    notes: 'Carvão, mostarda e brasa, tipografia condensada e as fotos reais da casa em primeiro plano. Logo e fotos são do próprio La Brasa.',
    swatches: ['#0E0C0A', '#F5B301', '#E8501E'],
  },
  {
    key: 'lume',
    name: 'Lume Café',
    kind: 'Café · confeitaria',
    notes: 'Creme, verde-sálvia e serifa delicada. Grade de fotos que valoriza doces e bebidas.',
    swatches: ['#F4EFE4', '#6F8B6E', '#2B2A26'],
  },
] as const

function MareScreen() {
  return (
    <div className="h-full bg-[#F3EADB] text-[#10302E]" style={{ fontFamily: "'Switzer', system-ui, sans-serif" }}>
      <div className="relative h-[42%]">
        <img src={img(0, 700)} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#10302E]" />
        <p className="absolute bottom-4 left-4 text-[34px] leading-none text-[#FBF7F0]" style={{ fontFamily: "'Gambetta', Georgia, serif", fontStyle: 'italic' }}>
          Casa Maré
        </p>
      </div>
      <div className="flex gap-1.5 border-b border-[#10302E]/10 px-3 py-2 text-[11px]">
        <span className="rounded-full bg-[#10302E] px-2.5 py-1 text-[#FBF7F0]">Para começar</span>
        <span className="px-2 py-1 text-[#3E5A57]">Do mar</span>
        <span className="px-2 py-1 text-[#3E5A57]">Na brasa</span>
      </div>
      <div className="space-y-3 px-4 pt-4">
        {[0, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-tight" style={{ fontFamily: "'Gambetta', Georgia, serif" }}>
                {P[i]!.name}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-[#3E5A57]">{P[i]!.description}</p>
              <p className="mt-1 text-[12px] font-semibold text-[#D9472B]">R$ {formatPriceShort(P[i]!.price)}</p>
            </div>
            <img src={img(i, 200)} alt="" className="size-14 rounded-xl object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BrasaScreen() {
  const display = "'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif"
  const L = laBrasaMenu.products
  return (
    <div className="h-full bg-[#0E0C0A] text-[#F3ECDF]" style={{ fontFamily: "'Archivo', system-ui, sans-serif" }}>
      <div className="relative flex flex-col items-center px-4 pt-10 pb-3" style={{ background: 'radial-gradient(90% 60% at 50% 110%, #E8501E55, transparent 60%)' }}>
        <img src="/demo/la-brasa/logo.webp" alt="" className="h-[118px] w-auto" />
        <p className="mt-2 text-center text-[24px] leading-[0.9] font-black uppercase" style={{ fontFamily: display }}>
          Burger de rua, <span className="text-[#F5B301]">feito na brasa.</span>
        </p>
      </div>
      <div className="flex gap-1 border-y border-[#2A2520] px-2 py-1.5 text-[12px] font-extrabold uppercase" style={{ fontFamily: display }}>
        <span className="bg-[#F5B301] px-2 py-1 text-[#0E0C0A]">Burgers</span>
        <span className="px-2 py-1">Smashs</span>
        <span className="px-2 py-1">Doces</span>
        <span className="px-2 py-1">Hot dogs</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-2.5">
        {[0, 3].map((i) => (
          <div key={i} className="bg-[#171411]">
            <div className="relative">
              <img src={productImage(L[i]!.image_path, 440) ?? ''} alt="" className="aspect-[4/5] w-full object-cover" />
              <span className="absolute bottom-0 left-0 bg-[#F5B301] px-1.5 text-[14px] font-extrabold text-[#0E0C0A]" style={{ fontFamily: display }}>
                R$ {formatPriceShort(L[i]!.price)}
              </span>
            </div>
            <p className="px-2 py-1.5 text-[15px] leading-none font-extrabold uppercase" style={{ fontFamily: display }}>
              {L[i]!.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function LumeScreen() {
  const serif = "'Boska', Georgia, serif"
  return (
    <div className="h-full bg-[#F4EFE4] text-[#2B2A26]" style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}>
      <div className="px-5 pt-11 text-center">
        <p className="text-[11px] tracking-[0.3em] text-[#6F8B6E] uppercase">café · confeitaria</p>
        <p className="mt-1 text-[38px] leading-none" style={{ fontFamily: serif, fontStyle: 'italic' }}>
          Lume
        </p>
        <div className="mx-auto mt-3 h-px w-12 bg-[#6F8B6E]" />
      </div>
      <div className="mt-4 flex justify-center gap-4 text-[12px]">
        <span className="border-b border-[#2B2A26] pb-1">Doces</span>
        <span className="pb-1 text-[#2B2A26]/50">Cafés</span>
        <span className="pb-1 text-[#2B2A26]/50">Bebidas</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 px-4">
        {[10, 11, 12, 14].map((i) => (
          <div key={i}>
            <img src={img(i, 300)} alt="" className="aspect-square w-full rounded-[14px] object-cover" />
            <p className="mt-1.5 line-clamp-1 text-[13px]" style={{ fontFamily: serif }}>
              {P[i]!.name}
            </p>
            <p className="text-[11px] text-[#6F8B6E]">R$ {formatPriceShort(P[i]!.price)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const screens = { mare: MareScreen, brasa: BrasaScreen, lume: LumeScreen }

function PersonalizationFonts() {
  useStylesheet('https://api.fontshare.com/v2/css?f[]=boska@400,400i&f[]=satoshi@400,500,700&f[]=gambetta@400,500,400i,500i&f[]=switzer@400,500,600&display=swap')
  useStylesheet('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Big+Shoulders+Display:wght@700;800;900&display=swap')
  return null
}

export function Personalization() {
  const ref = useRef<HTMLElement>(null)
  const near = useInView(ref, { once: true, margin: '500px 0px' })
  const [active, setActive] = useState<(typeof concepts)[number]['key']>('brasa')
  const Screen = screens[active]
  const current = concepts.find((c) => c.key === active)!

  return (
    <section ref={ref} id="personalizacao" aria-labelledby="custom-title" className="relative overflow-hidden py-24 sm:py-32">
      {near && <PersonalizationFonts />}
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <div>
          <SectionHeading
            id="custom-title"
            align="left"
            eyebrow="Personalização"
            title="Nenhum cardápio"
            accent="sai igual ao outro."
            description="Não trabalhamos com modelos prontos. Cada estabelecimento recebe um projeto próprio, desenhado a partir da cozinha, do salão e do público da casa."
          />
          <Reveal delay={0.1}>
            <div role="radiogroup" aria-label="Exemplos de identidade" className="mt-10 grid gap-2.5">
              {concepts.map((c) => {
                const on = c.key === active
                return (
                  <button
                    key={c.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setActive(c.key)}
                    className={cn(
                      'group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors duration-300',
                      on ? 'border-gold/35 bg-gold/[0.06]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15',
                    )}
                  >
                    <span className="flex -space-x-2" aria-hidden>
                      {c.swatches.map((s) => (
                        <span key={s} className="size-7 rounded-full ring-2 ring-navy-950" style={{ background: s }} />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-cream">{c.name}</span>
                      <span className="block text-sm text-dim">{c.kind}</span>
                    </span>
                    <span
                      className={cn('size-2.5 rounded-full transition-colors', on ? 'bg-gold' : 'bg-white/15 group-hover:bg-white/30')}
                      aria-hidden
                    />
                  </button>
                )
              })}
            </div>
          </Reveal>
          <AnimatePresence mode="wait">
            <motion.p
              key={current.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-6 text-[0.97rem] leading-relaxed text-mist"
              aria-live="polite"
            >
              {current.notes}
            </motion.p>
          </AnimatePresence>
          <p className="mt-6 text-sm text-dim">Casa Maré e La Brasa são cardápios demonstrativos navegáveis; Lume Café é um conceito ilustrativo. Nenhum deles é modelo pronto para escolha.</p>
        </div>

        <Reveal y={40} className="relative mx-auto">
          <div aria-hidden className="absolute inset-[-10%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(38_46_102/0.7),transparent)] blur-2xl" />
          <PhoneFrame className="w-[min(310px,82vw)]" label={`Exemplo de identidade: ${current.name}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
              >
                <Screen />
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </Reveal>
      </Container>
    </section>
  )
}

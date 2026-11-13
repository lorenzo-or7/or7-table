import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { Camera, KeyRound, Mail, PenTool, QrCode, Smartphone } from 'lucide-react'
import { cn } from '@/components/ui/primitives'
import { demoMenu } from '@/data/demo-menu'
import { productImage } from '@/lib/public-menu'
import { qrMenuUrl, DEMO_SLUG } from '@/lib/site'
import { Container, Reveal, SectionHeading } from './common'
import { QrSvg } from './QrSvg'

const steps = [
  {
    icon: PenTool,
    tab: 'Criamos seu cardápio',
    title: 'A Or7 desenha o cardápio da sua casa.',
    text: 'Partimos da identidade do seu estabelecimento para criar layout, cores e tipografia. Também cadastramos as primeiras categorias, produtos e fotos.',
    bullets: ['Projeto visual exclusivo', 'Cadastro inicial incluído', 'Endereço próprio definido'],
  },
  {
    icon: KeyRound,
    tab: 'Você recebe seu acesso',
    title: 'Um convite por e-mail e pronto.',
    text: 'Você recebe o convite, define sua senha e entra no painel do seu estabelecimento. Não existe cadastro aberto: cada acesso é criado pela equipe Or7.',
    bullets: ['Login com e-mail e senha', 'Recuperação de senha', 'Acesso só ao seu cardápio'],
  },
  {
    icon: Camera,
    tab: 'Atualiza seus produtos',
    title: 'Preço, foto e disponibilidade em poucos toques.',
    text: 'Cadastre, edite ou exclua produtos, organize categorias e envie fotos direto do celular. Ao salvar, o cardápio já mostra a mudança.',
    bullets: ['Funciona no computador e no celular', 'Fotos ajustadas automaticamente', 'Marque itens esgotados'],
  },
  {
    icon: QrCode,
    tab: 'Clientes acessam pelo QR',
    title: 'Na mesa, no balcão ou na vitrine.',
    text: 'O cliente aponta a câmera e o cardápio abre no navegador. O código impresso continua valendo para sempre, mesmo com o conteúdo mudando.',
    bullets: ['Arquivos prontos para impressão', 'Sem aplicativo', 'Abre em qualquer celular'],
  },
]

const DURATION = 6500

export function HowItWorks() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-20% 0px -20% 0px' })
  const reduce = useReducedMotion()
  const auto = inView && !paused && !reduce

  useEffect(() => {
    if (!auto) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % steps.length), DURATION)
    return () => window.clearTimeout(t)
  }, [auto, index])

  const step = steps[index]!

  return (
    <section id="como-funciona" aria-labelledby="how-title" className="relative py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_50%,rgb(38_46_102/0.45),transparent)]" />
      <Container>
        <SectionHeading id="how-title" eyebrow="Como funciona" title="Do primeiro esboço" accent="ao QR Code na mesa." />

        <div
          ref={ref}
          className="mt-14"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <Reveal>
            <div
              role="tablist"
              aria-label="Etapas"
              className="no-scrollbar mx-auto flex max-w-4xl gap-1 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 sm:rounded-full"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  const next = (index + (e.key === 'ArrowRight' ? 1 : steps.length - 1)) % steps.length
                  setIndex(next)
                  document.getElementById(`how-tab-${next}`)?.focus()
                }
              }}
            >
              {steps.map((s, i) => (
                <button
                  key={s.tab}
                  id={`how-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={i === index}
                  aria-controls="how-panel"
                  tabIndex={i === index ? 0 : -1}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'relative flex min-w-[170px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-[0.92rem] whitespace-nowrap transition-colors sm:rounded-full',
                    i === index ? 'text-cream' : 'text-dim hover:text-mist',
                  )}
                >
                  {i === index && (
                    <motion.span
                      layoutId="how-tab"
                      className="absolute inset-0 rounded-xl bg-white/[0.08] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] sm:rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span className="relative font-semibold text-gold tabular">{String(i + 1).padStart(2, '0')}</span>
                  <span className="relative">{s.tab}</span>
                  {i === index && auto && (
                    <motion.span
                      key={`bar-${index}`}
                      className="absolute bottom-0 left-4 h-[2px] rounded-full bg-gold/80"
                      style={{ width: 'calc(100% - 2rem)', transformOrigin: 'left' }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: DURATION / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div
              id="how-panel"
              role="tabpanel"
              aria-labelledby={`how-tab-${index}`}
              className="hairline-top relative mt-6 overflow-hidden rounded-[32px] border border-white/[0.07] bg-[linear-gradient(160deg,#121946,#0a0e26_60%)]"
            >
              <div className="grid min-h-[440px] items-center gap-10 p-7 sm:p-12 lg:grid-cols-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="grid size-12 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
                      <step.icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="display mt-6 text-4xl text-cream sm:text-5xl">{step.title}</h3>
                    <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-mist">{step.text}</p>
                    <ul className="mt-7 grid gap-2.5">
                      {step.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-[0.95rem] text-cream/90">
                          <span className="size-1.5 rounded-full bg-gold" aria-hidden />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
                <div className="relative flex min-h-[300px] items-center justify-center" aria-hidden>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full max-w-[420px]"
                    >
                      <StepVisual index={index} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 rounded-2xl border border-white/[0.08] bg-navy-950/70 p-4">
          <p className="eyebrow text-dim">Paleta</p>
          <div className="mt-3 flex gap-2">
            {['#10302E', '#3E5A57', '#F3EADB', '#D9472B'].map((c) => (
              <span key={c} className="h-14 flex-1 rounded-xl" style={{ background: c }} />
            ))}
          </div>
          <p className="eyebrow mt-5 text-dim">Tipografia</p>
          <p className="mt-2 text-4xl text-cream" style={{ fontFamily: "'Gambetta', Georgia, serif", fontStyle: 'italic' }}>
            Casa Maré
          </p>
          <p className="text-sm text-mist">Títulos com serifa, texto limpo.</p>
        </div>
        <div className="col-span-2 flex flex-col gap-3">
          <img src={productImage(demoMenu.products[7]!.image_path, 400) ?? ''} alt="" className="h-28 w-full rounded-2xl object-cover" />
          <img src={productImage(demoMenu.products[0]!.image_path, 400) ?? ''} alt="" className="h-28 w-full rounded-2xl object-cover" />
          <div className="flex-1 rounded-2xl border border-dashed border-gold/30 p-3 text-xs text-gold-soft">Layout exclusivo</div>
        </div>
      </div>
    )
  }
  if (index === 1) {
    return (
      <div className="relative">
        <div className="rounded-2xl border border-white/[0.08] bg-cream p-5 text-navy shadow-2xl">
          <div className="flex items-center gap-3 border-b border-navy/10 pb-4">
            <span className="grid size-9 place-items-center rounded-full bg-navy text-cream">
              <Mail className="size-4" />
            </span>
            <div className="text-sm">
              <p className="font-semibold">Seu acesso ao Or7 Table</p>
              <p className="text-navy/60">Convite para Casa Maré</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-navy/80">
            Você foi convidado para gerenciar o cardápio. Clique no botão para criar sua senha.
          </p>
          <span className="mt-4 inline-flex h-10 items-center rounded-full bg-navy px-5 text-sm font-medium text-cream">Aceitar convite</span>
        </div>
        <div className="absolute -right-3 -bottom-10 w-[62%] rounded-2xl border border-white/10 bg-navy-900 p-4 shadow-2xl sm:-right-8">
          <p className="text-xs text-mist">Nova senha</p>
          <div className="mt-2 flex h-10 items-center rounded-xl border border-gold/60 bg-navy-950 px-3 text-cream tracking-[0.3em]">••••••••</div>
          <p className="mt-2 text-[11px] text-mint">Senha forte</p>
        </div>
      </div>
    )
  }
  if (index === 2) {
    const p = demoMenu.products[10]!
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-navy-950/80 p-5 shadow-2xl">
        <p className="text-lg font-semibold text-cream">Editar produto</p>
        <div className="mt-4 grid grid-cols-[96px_1fr] gap-4">
          <div className="relative">
            <img src={productImage(p.image_path, 240) ?? ''} alt="" className="size-24 rounded-xl object-cover" />
            <span className="absolute -right-2 -bottom-2 grid size-8 place-items-center rounded-full bg-gold text-navy-950">
              <Camera className="size-4" />
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="h-10 rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm text-cream">{p.name}</div>
            <div className="flex gap-2">
              <div className="h-10 flex-1 rounded-xl border border-gold/60 bg-navy-900 px-3 py-2.5 text-sm text-cream tabular">R$ 34,00</div>
              <div className="h-10 flex-1 rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm text-mist">Sobremesas</div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="flex items-center gap-2 text-sm text-mist">
            <span className="relative h-6 w-10 rounded-full bg-gold">
              <span className="absolute top-[3px] left-[19px] size-4 rounded-full bg-navy-950" />
            </span>
            Disponível
          </span>
          <span className="inline-flex h-10 items-center rounded-full bg-gold px-5 text-sm font-medium text-navy-950">Salvar</span>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center gap-6">
      <div className="w-[150px] rounded-[22px] bg-cream p-3.5 shadow-2xl">
        <QrSvg value={qrMenuUrl(DEMO_SLUG)} />
      </div>
      <div className="flex flex-col items-center gap-2 text-gold">
        <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold" />
        <Smartphone className="size-5" />
        <span className="h-px w-14 bg-gradient-to-r from-gold to-transparent" />
      </div>
      <div className="w-[120px] overflow-hidden rounded-[22px] border-[5px] border-[#11173a] bg-[#F3EADB] shadow-2xl">
        <img src={productImage(demoMenu.products[0]!.image_path, 300) ?? ''} alt="" className="h-24 w-full object-cover" />
        <div className="space-y-1.5 p-2.5">
          <p className="text-[15px] leading-none text-[#10302E]" style={{ fontFamily: "'Gambetta', Georgia, serif", fontStyle: 'italic' }}>
            Casa Maré
          </p>
          <span className="block h-1.5 w-4/5 rounded bg-[#10302E]/15" />
          <span className="block h-1.5 w-3/5 rounded bg-[#10302E]/15" />
          <span className="block h-1.5 w-2/3 rounded bg-[#D9472B]/40" />
        </div>
      </div>
    </div>
  )
}

import { CalendarCheck, Check, PenTool, Plus, Repeat } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useInView } from 'motion/react'
import { cn } from '@/components/ui/primitives'
import { EditorialButton } from '@/components/ui/cta'
import { whatsappHref } from '@/lib/site'
import { Container, Reveal, SectionHeading } from './common'

const parts: Array<{
  step: string
  name: string
  cadence: string
  cadenceIcon: typeof CalendarCheck
  text: string
  items: string[]
  price: string
  priceNote: string
  gold: boolean
}> = [
  {
    step: '01',
    name: 'Criação do cardápio',
    cadence: 'Pagamento único',
    cadenceIcon: PenTool,
    text: 'Você paga uma vez para criarmos e configurarmos seu cardápio digital exclusivo.',
    items: [
      'Design exclusivo do cardápio',
      'Cadastro inicial de categorias, produtos e fotos',
      'Endereço permanente do estabelecimento',
      'QR Code em PNG e SVG para impressão',
      'Acesso do administrador ao painel',
    ],
    price: 'A partir de R$ 400',
    priceNote: 'Pagamento único pela criação',
    gold: false,
  },
  {
    step: '02',
    name: 'Manutenção e acesso',
    cadence: 'Todo mês',
    cadenceIcon: Repeat,
    text: 'Você paga todo mês para manter o cardápio online, editar seus produtos e receber suporte.',
    items: [
      'Cardápio publicado e acessível 24 horas',
      'Painel para produtos, preços, categorias e fotos',
      'Atualizações ilimitadas feitas por você',
      'Contagem de acessos ao cardápio',
      'Suporte da equipe Or7',
    ],
    price: 'Sob consulta',
    priceNote: 'Valor mensal definido na proposta',
    gold: true,
  },
]

/** Card com contorno animado; a luz só gira enquanto o card está visível. */
function FrameCard({ gold, children }: { gold: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const visible = useInView(ref, { margin: '80px 0px' })
  return (
    <article
      ref={ref}
      data-visible={visible ? 'true' : undefined}
      style={{ ['--frame-bg' as string]: gold ? 'linear-gradient(180deg,#171f52,#0d1230)' : '#0b1029' }}
      className={cn(
        'flex h-full flex-col rounded-[18px] p-7 sm:p-9',
        gold ? 'frame-gold shadow-[0_40px_100px_-40px_rgb(255_170_0/0.28)]' : 'frame-quiet',
      )}
    >
      {children}
    </article>
  )
}

export function Plans() {
  return (
    <section id="investimento" aria-labelledby="plans-title" className="relative py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[60%] bg-[radial-gradient(60%_70%_at_50%_100%,rgb(255_170_0/0.08),transparent)]" />
      <Container>
        <SectionHeading
          id="plans-title"
          eyebrow="Investimento"
          title="Um cardápio."
          accent="Duas etapas de pagamento."
          description="Não são dois planos. Você paga pela criação do cardápio uma única vez e, depois, uma mensalidade para continuar utilizando o serviço."
        />

        {/* linha do tempo: uma vez → todo mês */}
        <Reveal className="mx-auto mt-12 flex max-w-xl items-center justify-center gap-3 text-sm text-mist" y={10}>
          <span className="inline-flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-[3px] border border-white/15 text-[11px] font-semibold text-cream tabular">01</span>
            Criação · paga uma vez
          </span>
          <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/15 via-gold/60 to-gold" />
          <span className="inline-flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-[3px] bg-gold text-[11px] font-semibold text-navy-950 tabular">02</span>
            Manutenção · paga todo mês
          </span>
        </Reveal>

        <div className="relative mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2 md:gap-8">
          {/* conector "+" entre as duas partes */}
          <span
            aria-hidden
            className="absolute top-1/2 left-1/2 z-10 hidden size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[4px] border border-gold/40 bg-navy-950 text-gold shadow-[0_0_0_6px_#050819] md:grid"
          >
            <Plus className="size-5" />
          </span>
          {parts.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.12} className="h-full">
              <FrameCard gold={p.gold}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={cn('font-[family-name:var(--font-ui)] text-xs font-semibold tracking-[0.16em] tabular', p.gold ? 'text-gold' : 'text-dim')}>
                      PARTE {p.step}
                    </p>
                    <h3 className="mt-2 text-[1.7rem] font-semibold text-cream">{p.name}</h3>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-xs',
                      p.gold ? 'border-gold/35 bg-gold/10 text-gold-soft' : 'border-white/12 text-mist',
                    )}
                  >
                    <p.cadenceIcon className="size-3.5" aria-hidden />
                    {p.cadence}
                  </span>
                </div>
                <p className="mt-3 text-[0.97rem] leading-relaxed text-mist">{p.text}</p>
                <div className="mt-8 flex items-end gap-3 border-y border-white/[0.07] py-5">
                  <div><p className="display text-[clamp(1.7rem,3.2vw,2.8rem)] text-cream">{p.price}</p><p className="mt-1 text-xs text-dim">{p.priceNote}</p></div>
                </div>
                <ul className="mt-6 grid gap-3.5">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[0.97rem] text-cream/90">
                      <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-[3px]', p.gold ? 'bg-gold text-navy-950' : 'bg-white/[0.07] text-gold')}>
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </FrameCard>
            </Reveal>
          ))}
        </div>
        <Reveal className="mx-auto mt-8 max-w-3xl rounded-[12px] border border-gold/25 bg-gold/[0.055] px-5 py-6 text-center sm:px-8">
          <p className="text-sm font-semibold text-cream">Uma contratação, duas cobranças.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-mist">
            Primeiro você investe na criação do cardápio. Depois paga a mensalidade para mantê-lo disponível e usar o painel. As duas etapas fazem parte do mesmo serviço.
          </p>
          <div className="mx-auto mt-5 max-w-sm">
            <EditorialButton href={whatsappHref('proposal')} className="w-full">
              Solicitar proposta completa
            </EditorialButton>
          </div>
        </Reveal>
        <Reveal className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-dim">
          A criação começa em R$ 400; o valor final e a mensalidade são informados antes da contratação. O Or7 Table não inclui pedidos online, pagamentos ou integração com o caixa: o foco é o
          cardápio.
        </Reveal>
      </Container>
    </section>
  )
}

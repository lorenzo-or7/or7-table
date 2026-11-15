/**
 * Investimento — jornada de contratação (sem preços: os valores vão na proposta).
 * Um único painel = um único serviço. Uma linha atravessa as duas etapas: começa na criação
 * (pagamento único), passa pelo marco "cardápio no ar" e segue tracejada na manutenção (mensal).
 * Embaixo, um conector reúne as duas etapas num único CTA. No celular, a linha corre na vertical
 * e desemboca no CTA.
 */
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/components/ui/primitives'
import { EditorialButton } from '@/components/ui/cta'
import { whatsappHref } from '@/lib/site'
import { Container, Eyebrow, Reveal, WordReveal } from './common'

const ease = [0.22, 1, 0.36, 1] as const

const stages = [
  {
    n: '01',
    cadence: 'Pagamento único',
    title: 'Criamos sua experiência.',
    text: 'Do primeiro esboço ao QR Code na mesa, montamos o cardápio com a cara do seu negócio.',
    items: ['Design exclusivo', 'Identidade visual do cardápio', 'Cadastro inicial dos produtos', 'Organização por categorias', 'QR Code pronto para impressão', 'Painel configurado para você'],
    recurring: false,
  },
  {
    n: '02',
    cadence: 'Cobrança mensal',
    title: 'Mantemos tudo funcionando.',
    text: 'Com o cardápio no ar, a parte técnica fica com a Or7. Você atualiza o conteúdo quando quiser.',
    items: ['Hospedagem', 'Manutenção técnica', 'Acesso ao painel', 'Preços e produtos atualizados por você', 'Estatísticas de acesso', 'Suporte da equipe Or7'],
    recurring: true,
  },
] as const

function Node({ n, filled, delay, animate, ring = '#0b1029' }: { n: string; filled?: boolean; delay: number; animate: boolean; ring?: string }) {
  return (
    <motion.span
      aria-hidden
      className={cn(
        'relative z-10 grid size-10 shrink-0 place-items-center rounded-[4px] font-[family-name:var(--font-ui)] text-[13px] font-semibold tabular',
        filled ? 'bg-gold text-navy-950' : 'border border-gold/50 bg-navy-950 text-gold',
      )}
      style={{ boxShadow: `0 0 0 6px ${ring}${filled ? ', 0 10px 30px -8px rgb(255 170 0 / 0.6)' : ''}` }}
      initial={animate ? { opacity: 0, scale: 0.6 } : false}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ duration: 0.5, delay, ease }}
    >
      {n}
    </motion.span>
  )
}

function Milestone({ delay, animate, className, ring = '#0b1029' }: { delay: number; animate: boolean; className?: string; ring?: string }) {
  return (
    <motion.span
      aria-hidden
      className={cn('relative z-10 block size-3 rotate-45 border border-gold', className)}
      style={{ background: ring, boxShadow: `0 0 0 6px ${ring}` }}
      initial={animate ? { opacity: 0, scale: 0.4 } : false}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ duration: 0.45, delay, ease }}
    />
  )
}

function StageBody({ stage, className }: { stage: (typeof stages)[number]; className?: string }) {
  return (
    <div className={className}>
      <p className={cn('eyebrow tabular', stage.recurring ? 'text-gold' : 'text-dim')}>
        {stage.n} / {stage.cadence}
      </p>
      <h3 className="display mt-3 max-w-[14ch] text-[2rem] leading-[0.95] text-balance text-cream sm:text-[2.4rem] lg:text-[2.6rem]">{stage.title}</h3>
      <p className="mt-4 max-w-[46ch] text-[0.98rem] leading-relaxed text-mist">{stage.text}</p>
      <ul className="mt-6 grid border-t border-white/[0.07] sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-1">
        {stage.items.map((item) => (
          <li key={item} className="flex items-baseline gap-3 border-b border-white/[0.06] py-2.5 text-[0.94rem] text-cream/85">
            <span aria-hidden className={cn('relative -top-px size-1.5 shrink-0', stage.recurring ? 'bg-gold' : 'border border-gold/70')} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Plans() {
  const reduce = Boolean(useReducedMotion())
  const animate = !reduce
  const draw = (delay: number, axis: 'x' | 'y' = 'x') => ({
    initial: animate ? { [axis === 'x' ? 'scaleX' : 'scaleY']: 0 } : false,
    whileInView: { [axis === 'x' ? 'scaleX' : 'scaleY']: 1 },
    viewport: { once: true, margin: '0px 0px -15% 0px' },
    transition: { duration: 0.9, delay, ease },
  })

  return (
    <section id="investimento" aria-labelledby="plans-title" className="relative py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[60%] bg-[radial-gradient(60%_70%_at_50%_100%,rgb(255_170_0/0.07),transparent)]" />
      <Container>
        {/* cabeçalho editorial: título à esquerda, contexto à direita */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-16">
          <div>
            <Reveal y={12}>
              <Eyebrow>Investimento</Eyebrow>
            </Reveal>
            <h2 id="plans-title" className="display mt-6 text-[2.6rem] text-cream sm:text-6xl lg:text-[4.6rem]">
              <WordReveal text="Seu cardápio." />
              <br />
              <WordReveal text="Nossa estrutura." className="text-mist/55" delay={0.15} />
            </h2>
          </div>
          <Reveal delay={0.15} className="max-w-md lg:pb-3">
            <p className="text-[1.05rem] leading-relaxed text-mist">
              Criamos um cardápio digital exclusivo para o seu negócio. Você cuida do conteúdo, e a tecnologia fica com a gente.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-dim">É um serviço só, em duas etapas: a criação no início e a manutenção enquanto o cardápio estiver no ar.</p>
          </Reveal>
        </div>

        {/* ------------------------------------------------------------------ desktop */}
        <div className="mt-16 hidden lg:block">
          <ol aria-label="Etapas do serviço" className="relative rounded-[18px] border border-white/[0.08] bg-[#0b1029] px-10 pt-10 pb-12 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
            {/* trilho: criação → cardápio no ar → manutenção (tracejado = recorrente) */}
            <div aria-hidden className="relative grid grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)] items-center">
              <div className="relative flex items-center">
                <Node n="01" delay={0.1} animate={animate} />
                <motion.span className="h-px flex-1 origin-left bg-gradient-to-r from-gold/50 to-gold" {...draw(0.2)} />
              </div>
              <div className="relative flex items-center">
                <motion.span className="h-px flex-1 origin-left bg-gold" {...draw(0.55)} />
                <Milestone delay={0.75} animate={animate} />
                <motion.span className="h-px flex-1 origin-left bg-gold" {...draw(0.8)} />
              </div>
              <div className="relative flex items-center">
                <Node n="02" filled delay={1} animate={animate} />
                <motion.span className="journey-recurring h-px flex-1 origin-left" {...draw(1.1)} />
                <span className="ml-3 shrink-0 font-[family-name:var(--font-ui)] text-[11px] font-semibold tracking-[0.14em] text-gold uppercase">todo mês</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)]">
              <li className="list-none pr-10">
                <Reveal delay={0.2}>
                  <StageBody stage={stages[0]} />
                </Reveal>
              </li>
              <li className="list-none" aria-label="Marco: cardápio no ar">
                <Reveal delay={0.8} className="px-3 text-center">
                  <p className="eyebrow text-gold">Cardápio no ar</p>
                  <p className="mt-2 text-[13px] leading-snug text-dim">QR Code na mesa e painel liberado para você</p>
                </Reveal>
              </li>
              <li className="list-none pl-10">
                <Reveal delay={1}>
                  <StageBody stage={stages[1]} />
                </Reveal>
              </li>
            </div>
          </ol>

          {/* conector: as duas etapas convergem para uma única proposta */}
          <div aria-hidden className="grid h-16 grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)] px-10">
            <div className="relative pr-10">
              <span className="absolute top-0 left-1/2 h-1/2 w-px -translate-x-[20px] bg-white/20" />
              <motion.span className="absolute top-1/2 right-0 left-[calc(50%-20px)] h-px origin-left bg-gradient-to-r from-white/20 to-gold/60" {...draw(0.1)} />
            </div>
            <div className="relative">
              <motion.span className="absolute inset-x-0 top-1/2 h-px origin-left bg-gold/60" {...draw(0.3)} />
              <motion.span className="absolute top-1/2 bottom-0 left-1/2 w-px origin-top bg-gold/70" {...draw(0.5, 'y')} />
            </div>
            <div className="relative pl-10">
              <span className="absolute top-0 left-[calc(50%+20px)] h-1/2 w-px bg-gold/50" />
              <motion.span className="absolute top-1/2 right-[calc(50%-20px)] left-0 h-px origin-right bg-gold/60" {...draw(0.1)} />
            </div>
          </div>

          <Reveal className="flex flex-col items-center text-center">
            <EditorialButton href={whatsappHref('proposal')} className="px-8">
              Solicitar proposta personalizada
            </EditorialButton>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-dim">
              Os valores das duas etapas são apresentados na proposta, de acordo com o projeto. O Or7 Table não inclui pedidos online, pagamentos ou integração com o caixa.
            </p>
          </Reveal>
        </div>

        {/* ------------------------------------------------------------- celular / tablet */}
        <ol aria-label="Etapas do serviço" className="mt-12 lg:hidden">
          <li className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-5 pb-10 sm:gap-x-7">
            <motion.span aria-hidden className="absolute top-5 bottom-0 left-5 w-px origin-top bg-gradient-to-b from-gold/40 to-gold" {...draw(0.1, 'y')} />
            <Node n="01" delay={0.05} animate={animate} ring="#050819" />
            <Reveal y={16} className="pt-2">
              <StageBody stage={stages[0]} />
            </Reveal>
          </li>

          <li className="relative grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-5 pb-10 sm:gap-x-7" aria-label="Marco: cardápio no ar">
            <motion.span aria-hidden className="absolute top-0 bottom-0 left-5 w-px origin-top bg-gold" {...draw(0.2, 'y')} />
            <span className="grid place-items-center">
              <Milestone delay={0.2} animate={animate} ring="#050819" />
            </span>
            <p className="text-sm">
              <span className="eyebrow text-gold">Cardápio no ar</span>
              <span className="mt-1 block text-dim">QR Code na mesa e painel liberado para você</span>
            </p>
          </li>

          <li className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-5 pb-12 sm:gap-x-7">
            <motion.span aria-hidden className="journey-recurring-y absolute top-0 bottom-0 left-5 w-px origin-top" {...draw(0.2, 'y')} />
            <Node n="02" filled delay={0.1} animate={animate} ring="#050819" />
            <Reveal y={16} className="pt-2">
              <StageBody stage={stages[1]} />
              <p className="mt-4 font-[family-name:var(--font-ui)] text-[11px] font-semibold tracking-[0.14em] text-gold uppercase">Todo mês, enquanto estiver no ar</p>
            </Reveal>
          </li>

          <li className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-5 sm:gap-x-7">
            <span aria-hidden className="absolute top-0 left-5 h-[25px] w-px bg-gold" />
            <span aria-hidden className="relative z-10 mx-auto mt-5 block size-2.5 rounded-full bg-gold shadow-[0_0_0_6px_#050819]" />
            <Reveal y={12}>
              <EditorialButton href={whatsappHref('proposal')} className="w-full gap-2 px-4 text-center text-[0.95rem] sm:w-auto sm:gap-3 sm:px-8 sm:text-base">
                Solicitar proposta personalizada
              </EditorialButton>
              <p className="mt-4 text-sm leading-relaxed text-dim">
                Os valores das duas etapas são apresentados na proposta, de acordo com o projeto. O Or7 Table não inclui pedidos online, pagamentos ou integração com o caixa.
              </p>
            </Reveal>
          </li>
        </ol>
      </Container>
    </section>
  )
}

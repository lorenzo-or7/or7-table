import { useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Lock, RotateCw } from 'lucide-react'
import { cn } from '@/components/ui/primitives'
import { formatBRL, parseBRL, priceToInput } from '@/lib/format'
import { publicMenuUrl, DEMO_SLUG, qrMenuUrl } from '@/lib/site'
import { demoMenu } from '@/data/demo-menu'
import { productImage } from '@/lib/public-menu'
import { Container, Reveal, SectionHeading } from './common'
import { QrSvg } from './QrSvg'

function BentoCard({
  className,
  visual,
  title,
  text,
  delay = 0,
}: {
  className?: string
  visual: ReactNode
  title: string
  text: string
  delay?: number
}) {
  return (
    <Reveal delay={delay} className={cn('group relative', className)}>
      <article className="hairline-top relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-[linear-gradient(180deg,#0f1534,#0a0e26)] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] transition-colors duration-300 hover:border-white/[0.12]">
        <div className="relative flex-1 p-5 sm:p-6">{visual}</div>
        <div className="px-6 pt-1 pb-7 sm:px-7">
          <h3 className="text-xl font-semibold tracking-tight text-cream">{title}</h3>
          <p className="mt-2 max-w-md text-[0.97rem] leading-relaxed text-mist">{text}</p>
        </div>
      </article>
    </Reveal>
  )
}

/* 1 — preço alterado e publicado ao salvar */
function PriceDemo() {
  const product = demoMenu.products[7]!
  const [value, setValue] = useState(priceToInput(product.price))
  const [published, setPublished] = useState(product.price)
  const [error, setError] = useState<string | null>(null)
  const [stamp, setStamp] = useState(0)
  const parsed = parseBRL(value)

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (parsed === null || parsed <= 0 || parsed > 9999) {
      setError('Digite um preço válido, como 132,00.')
      return
    }
    setError(null)
    setPublished(parsed)
    setValue(priceToInput(parsed))
    setStamp((s) => s + 1)
  }

  return (
    <div className="grid h-full gap-4 sm:grid-cols-2">
      <form onSubmit={save} className="flex flex-col rounded-2xl border border-white/[0.07] bg-navy-950/70 p-4" aria-label="Simulação: editar preço">
        <p className="eyebrow text-dim">Painel · editar produto</p>
        <p className="mt-3 font-semibold text-cream">{product.name}</p>
        <label htmlFor="bento-price" className="mt-4 text-sm text-mist">
          Preço
        </label>
        <div className="mt-1.5 flex h-11 items-center rounded-xl border border-white/10 bg-navy-900 px-3 focus-within:border-gold/70 focus-within:shadow-[0_0_0_3px_rgb(255_170_0/0.15)]">
          <span className="text-sm text-dim">R$</span>
          <input
            id="bento-price"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'bento-price-error' : undefined}
            className="h-full w-full bg-transparent pl-2 text-cream tabular outline-none"
          />
        </div>
        {error && (
          <p id="bento-price-error" className="mt-1.5 text-xs text-red-soft" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gold pt-0 text-sm font-medium text-navy-950 transition-colors hover:bg-gold-soft max-sm:mt-4"
        >
          Salvar alteração
        </button>
      </form>
      <div className="relative overflow-hidden rounded-2xl bg-[#F3EADB] p-4 text-[#10302E]" aria-live="polite">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-[#D9472B] uppercase">Cardápio do cliente</p>
        <img src={productImage(product.image_path, 500) ?? ''} alt="" loading="lazy" className="mt-3 aspect-[16/10] w-full rounded-xl object-cover" />
        <p className="mt-3 text-lg leading-tight" style={{ fontFamily: "'Gambetta', Georgia, serif" }}>
          {product.name}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <motion.span
            key={stamp}
            initial={stamp ? { scale: 1.18, color: '#D9472B' } : false}
            animate={{ scale: 1, color: '#10302E' }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="origin-left text-base font-semibold tabular"
          >
            {formatBRL(published)}
          </motion.span>
          <AnimatePresence>
            {stamp > 0 && (
              <motion.span
                key={stamp}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3E5A57]"
              >
                <Check className="size-3" /> atualizado agora
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* 2 — disponibilidade */
function AvailabilityDemo() {
  const items = [demoMenu.products[1]!, demoMenu.products[8]!, demoMenu.products[13]!]
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((p, i) => [p.id, i !== 1])))
  return (
    <ul className="grid h-full content-center gap-2" aria-label="Simulação: disponibilidade dos produtos">
      {items.map((p) => {
        const on = state[p.id]!
        return (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-navy-950/60 p-2.5">
            <img src={productImage(p.image_path, 120) ?? ''} alt="" loading="lazy" className={cn('size-11 rounded-xl object-cover transition-[filter] duration-300', !on && 'grayscale')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-cream">{p.name}</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={String(on)}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.18 }}
                  className={cn('text-xs', on ? 'text-mint' : 'text-red-soft')}
                >
                  {on ? 'Aparece no cardápio' : 'Esgotado hoje'}
                </motion.p>
              </AnimatePresence>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${p.name} disponível`}
              onClick={() => setState((s) => ({ ...s, [p.id]: !on }))}
              className={cn(
                'relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200',
                on ? 'border-gold/60 bg-gold' : 'border-white/12 bg-white/[0.08]',
              )}
            >
              <span className={cn('absolute top-[4px] size-[18px] rounded-full transition-all duration-200', on ? 'left-[24px] bg-navy-950' : 'left-[4px] bg-mist')} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* 3 — QR permanente */
function QrVisual() {
  return (
    <div className="flex h-full items-center justify-center py-2">
      <div className="relative">
        <div className="w-[150px] rotate-[-4deg] rounded-[22px] bg-cream p-3.5 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.9)] transition-transform duration-500 group-hover:rotate-0">
          <QrSvg value={qrMenuUrl(DEMO_SLUG)} />
          <p className="mt-2 text-center text-[10px] font-semibold tracking-[0.18em] text-navy uppercase">Mesa 07</p>
        </div>
        <span className="absolute -right-6 -bottom-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-navy-800 px-3 py-1.5 text-[11px] text-cream shadow-lg">
          <RotateCw className="size-3 text-gold" /> conteúdo sempre atual
        </span>
      </div>
    </div>
  )
}

/* 4 — navegador, sem app */
function BrowserVisual() {
  const url = publicMenuUrl(DEMO_SLUG).replace(/^https?:\/\//, '')
  return (
    <div className="flex h-full flex-col justify-center gap-3 py-2">
      <div className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-navy-950/80 px-4 text-sm text-mist">
        <Lock className="size-3.5 shrink-0 text-mint" aria-hidden />
        <span className="truncate font-[family-name:var(--font-ui)] text-[13px]">{url}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs text-dim">
        {['Android', 'iPhone', 'Tablet'].map((d) => (
          <span key={d} className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5">
            {d}
          </span>
        ))}
      </div>
    </div>
  )
}

/* 5 — identidade */
function IdentityVisual() {
  const sets = [
    { name: 'Casa Maré', colors: ['#10302E', '#F3EADB', '#D9472B'], font: "'Gambetta', Georgia, serif", italic: true },
    { name: 'La Brasa', colors: ['#0E0C0A', '#F5B301', '#E8501E'], font: "'Big Shoulders Display', Impact, sans-serif", italic: false },
    { name: 'Lume Café', colors: ['#F4EFE4', '#6F8B6E', '#2B2A26'], font: "'Boska', Georgia, serif", italic: true },
  ]
  return (
    <ul className="grid h-full content-center gap-2.5">
      {sets.map((s) => (
        <li key={s.name} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-navy-950/60 px-4 py-2.5">
          <span className="truncate text-lg text-cream" style={{ fontFamily: s.font, fontStyle: s.italic ? 'italic' : 'normal' }}>
            {s.name}
          </span>
          <span className="flex -space-x-1.5" aria-hidden>
            {s.colors.map((c) => (
              <span key={c} className="size-5 rounded-full ring-2 ring-navy-950" style={{ background: c }} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Benefits() {
  return (
    <section id="beneficios" aria-labelledby="benefits-title" className="relative py-24 sm:py-32">
      <Container>
        <SectionHeading
          id="benefits-title"
          eyebrow="Benefícios"
          title="O que muda no salão"
          accent="muda no cardápio."
          description="Você cuida da cozinha e do atendimento. O cardápio acompanha o seu dia, sem reimpressão e sem esperar ninguém."
        />
        <div className="mt-16 grid gap-4 lg:grid-cols-6">
          <BentoCard
            className="lg:col-span-4"
            visual={<PriceDemo />}
            title="Preço novo, publicado ao salvar"
            text="Mudou o fornecedor, mudou o preço. Você altera no painel e o cliente vê o valor novo na próxima vez que abrir o cardápio. Teste ao lado."
          />
          <BentoCard
            className="lg:col-span-2"
            delay={0.08}
            visual={<AvailabilityDemo />}
            title="Acabou? Um toque."
            text="Marque um prato como esgotado e ele aparece sinalizado. Ninguém pede o que não tem."
          />
          <BentoCard
            className="lg:col-span-2"
            visual={<QrVisual />}
            title="QR Code que não muda"
            text="Cada casa tem um endereço permanente. Você imprime uma vez e segue atualizando o conteúdo."
          />
          <BentoCard
            className="lg:col-span-2"
            delay={0.08}
            visual={<BrowserVisual />}
            title="Nada para baixar"
            text="Abre no navegador de qualquer celular. O cliente não instala aplicativo nem faz cadastro."
          />
          <BentoCard
            className="lg:col-span-2"
            delay={0.16}
            visual={<IdentityVisual />}
            title="Identidade exclusiva"
            text="Cores, fontes e composição desenhadas para a sua casa. Nenhum cardápio sai igual ao outro."
          />
        </div>
        <Reveal className="mt-8 flex justify-center">
          <a href="#personalizacao" className="group inline-flex items-center gap-2 text-[0.95rem] text-mist transition-colors hover:text-cream">
            Ver como funciona a personalização
            <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden />
          </a>
        </Reveal>
      </Container>
    </section>
  )
}

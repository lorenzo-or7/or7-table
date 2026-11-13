import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/components/ui/primitives'
import { ArrowUpRight, Printer, RefreshCw, ScanLine } from 'lucide-react'
import { demoMenus, qrMenuUrl } from '@/lib/site'
import { Container, Reveal, SectionHeading } from './common'
import { QrSvg } from './QrSvg'

const flow = [
  { icon: Printer, title: 'Imprima uma vez', text: 'Displays de mesa, adesivos, balcão. Os arquivos saem em PNG e SVG, prontos para gráfica.' },
  { icon: RefreshCw, title: 'Atualize quando quiser', text: 'Preços, fotos e itens mudam no painel. O código impresso não muda.' },
  { icon: ScanLine, title: 'O cliente só aponta a câmera', text: 'A câmera nativa do celular reconhece o código e abre o cardápio no navegador.' },
]

export function QrSection() {
  const reduce = useReducedMotion()
  const [pick, setPick] = useState(1)
  const demo = demoMenus[pick]!
  const url = qrMenuUrl(demo.slug)
  return (
    <section id="qr-code" aria-labelledby="qr-title" className="relative py-24 sm:py-32">
      <Container>
        <div className="hairline-top relative overflow-hidden rounded-[36px] border border-white/[0.07] bg-[linear-gradient(135deg,#131a48_0%,#0b1029_55%,#0a0d22_100%)] px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
          <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 size-[420px] rounded-full bg-gold/[0.07] blur-[100px]" />
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div>
              <SectionHeading
                id="qr-title"
                align="left"
                eyebrow="QR Code"
                title="Aponte a câmera."
                accent="O cardápio abre."
              />
              <ol className="mt-10 grid gap-6">
                {flow.map((f, i) => (
                  <li key={f.title}>
                    <Reveal delay={i * 0.08} className="flex gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-gold">
                        <f.icon className="size-5" aria-hidden />
                      </span>
                      <div>
                        <p className="font-semibold text-cream">{f.title}</p>
                        <p className="mt-1 max-w-md text-[0.95rem] leading-relaxed text-mist">{f.text}</p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>

            <Reveal y={36} className="flex flex-col items-center">
              <div role="group" aria-label="Cardápio do QR Code" className="mb-8 inline-flex rounded-[4px] border border-white/10 bg-white/[0.03] p-1">
                {demoMenus.map((d, i) => (
                  <button
                    key={d.slug}
                    type="button"
                    aria-pressed={pick === i}
                    onClick={() => setPick(i)}
                    className={cn('rounded-[3px] px-4 py-1.5 text-sm transition-colors', pick === i ? 'bg-gold text-navy-950' : 'text-mist hover:text-cream')}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
              {/* display de mesa */}
              <div className="relative">
                <div className="relative w-[250px] rounded-[30px] bg-cream p-5 text-navy shadow-[0_50px_100px_-30px_rgb(0_0_0/0.9)] sm:w-[280px]">
                  <p className="text-center text-[11px] font-semibold tracking-[0.24em] uppercase">{demo.name}</p>
                  <p className="mt-0.5 text-center text-[11px] text-navy/60">Mesa 07 · cardápio digital</p>
                  <div className="relative mt-4 overflow-hidden rounded-2xl">
                    <QrSvg value={url} label={`QR Code do cardápio demonstrativo ${demo.name}`} />
                    {!reduce && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent via-gold/35 to-transparent will-change-transform"
                        initial={{ y: -48 }}
                        animate={{ y: 260 }}
                        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                  <p className="mt-4 text-center text-sm font-medium">Aponte a câmera do celular</p>
                </div>
                <div aria-hidden className="mx-auto h-4 w-[70%] rounded-b-2xl bg-[#d9d2c4]" />
              </div>
              <p className="mt-8 max-w-xs text-center text-sm text-mist">
                Este código é real e abre o cardápio demonstrativo deste site.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-white/10 px-4 py-2 font-[family-name:var(--font-ui)] text-xs text-cream/80 transition-colors hover:border-white/20 hover:text-cream"
              >
                <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
                <ArrowUpRight className="size-3.5 shrink-0 text-gold" aria-hidden />
              </a>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}

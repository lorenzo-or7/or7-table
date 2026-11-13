import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Ban, Check, CircleHelp, Palette, PencilLine, Plus, QrCode, Smartphone, Wallet } from 'lucide-react'
import { cn } from '@/components/ui/primitives'
import { SplitButton } from '@/components/ui/cta'
import { WHATSAPP_DISPLAY, whatsappHref } from '@/lib/site'
import { WhatsAppLogo } from '@/components/brand/WhatsApp'
import { Container, Reveal, SectionHeading } from './common'

type Faq = {
  icon: typeof CircleHelp
  q: string
  lead: string
  points?: string[]
  note?: string
}

const faqs: Faq[] = [
  {
    icon: CircleHelp,
    q: 'Como funciona o Or7 Table?',
    lead: 'A Or7 cria o cardápio digital da sua casa e entrega um painel simples para você manter tudo em dia.',
    points: ['Design exclusivo, feito para o seu estabelecimento', 'Painel para produtos, preços e fotos', 'Clientes acessam pelo QR Code na mesa'],
  },
  {
    icon: PencilLine,
    q: 'Consigo atualizar o cardápio sozinho?',
    lead: 'Sim. Pelo painel, no computador ou no celular, você muda o que precisar em poucos toques.',
    points: ['Cadastrar, editar e excluir produtos', 'Alterar preços e fotos', 'Organizar categorias e a ordem delas', 'Marcar itens como esgotados'],
    note: 'Salvou, já aparece para o cliente.',
  },
  {
    icon: QrCode,
    q: 'Preciso trocar o QR Code quando mudar algo?',
    lead: 'Não. O QR Code aponta para um endereço fixo do seu cardápio.',
    note: 'Você imprime uma vez e segue atualizando o conteúdo pelo painel.',
  },
  {
    icon: Smartphone,
    q: 'O cliente precisa baixar algum aplicativo?',
    lead: 'Não. O cardápio abre direto no navegador do celular.',
    points: ['Funciona em Android e iPhone', 'Sem cadastro e sem instalação'],
  },
  {
    icon: Palette,
    q: 'Posso escolher as cores e o estilo?',
    lead: 'O visual é criado pela equipe Or7 junto com você, a partir da identidade do seu estabelecimento.',
    note: 'Depois de publicado, o painel serve para o conteúdo. Ajustes de layout ficam com a nossa equipe.',
  },
  {
    icon: Wallet,
    q: 'Como funciona a mensalidade?',
    lead: 'São duas cobranças que se completam:',
    points: ['Implantação: paga uma vez, monta o cardápio', 'Mensalidade: mantém o cardápio no ar, com painel e suporte'],
    note: 'Os valores são definidos na proposta, conforme o projeto.',
  },
  {
    icon: Ban,
    q: 'Dá para receber pedidos pelo cardápio?',
    lead: 'Não. O Or7 Table é um cardápio digital para consulta.',
    note: 'Pedidos e pagamentos continuam com a operação que você já usa.',
  },
]

function Item({ faq, open, onToggle, index }: { faq: Faq; open: boolean; onToggle: () => void; index: number }) {
  const id = useId()
  const Icon = faq.icon
  return (
    <div
      className={cn(
        'rounded-[14px] border transition-[border-color,background-color] duration-300',
        open ? 'border-gold/25 bg-[linear-gradient(180deg,rgb(255_170_0/0.05),rgb(255_255_255/0.02))]' : 'border-white/[0.07] bg-white/[0.015] hover:border-white/[0.14]',
      )}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={onToggle}
          className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
        >
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-[10px] border transition-colors duration-300',
              open ? 'border-gold/40 bg-gold text-navy-950' : 'border-white/10 bg-white/[0.04] text-gold',
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
          </span>
          <span className="flex-1 text-[1rem] font-medium text-cream sm:text-[1.05rem]">
            <span className="mr-2 font-[family-name:var(--font-ui)] text-xs text-dim tabular">{String(index + 1).padStart(2, '0')}</span>
            {faq.q}
          </span>
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }} className="shrink-0 text-gold">
            <Plus className="size-5" aria-hidden />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 sm:pr-6 sm:pl-[76px]">
              <p className="text-[1rem] leading-relaxed text-cream/90">{faq.lead}</p>
              {faq.points && (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {faq.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 rounded-[10px] border border-white/[0.06] bg-navy-950/50 px-3 py-2.5 text-[0.93rem] text-mist">
                      <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                      {pt}
                    </li>
                  ))}
                </ul>
              )}
              {faq.note && (
                <p className="mt-3 border-l-2 border-gold pl-3 text-[0.93rem] leading-relaxed text-mist">
                  <strong className="font-semibold text-cream">Em resumo:</strong> {faq.note}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="duvidas" aria-labelledby="faq-title" className="relative py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading id="faq-title" align="left" eyebrow="Dúvidas" title="Perguntas" accent="frequentes." description="Respostas diretas sobre o produto, a contratação e o dia a dia com o painel." />
          <Reveal delay={0.2} className="mt-8 rounded-[14px] border border-white/[0.08] bg-navy-900/70 p-5">
            <p className="font-semibold text-cream">Ficou alguma dúvida?</p>
            <p className="mt-1 text-sm text-mist">Fale com a equipe Or7 pelo WhatsApp <span className="inline-flex items-center gap-1 align-middle text-cream"><WhatsAppLogo className="size-3.5" />{WHATSAPP_DISPLAY}</span>.</p>
            <SplitButton href={whatsappHref('question')} size="md" tone="dark" className="mt-4">
              Perguntar no WhatsApp
            </SplitButton>
          </Reveal>
        </div>
        <Reveal className="grid grid-cols-1 content-start gap-3">
          {faqs.map((f, i) => (
            <Item key={f.q} faq={f} index={i} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </Reveal>
      </Container>
    </section>
  )
}

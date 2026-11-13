import { appPath } from '@/lib/site'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Mail } from 'lucide-react'
import { GitHubLogo, InstagramLogo, WhatsAppLogo } from '@/components/brand/WhatsApp'
import { Logo, Or7Signature } from '@/components/brand/Logo'
import { OutlineButton, SplitButton } from '@/components/ui/cta'
import {
  CONTACT_EMAIL,
  DEMO_SLUG,
  GITHUB_HANDLE,
  GITHUB_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  LA_BRASA_SLUG,
  STARBUCKS_SLUG,
  WHATSAPP_DISPLAY,
  whatsappHref,
} from '@/lib/site'
import { Container, Reveal, WordReveal } from './common'

/** Linhas angulares da arte oficial da marca, usadas como moldura. */
function BrandLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden fill="none">
      <path d="M0 150 H112 L160 0" stroke="#FF001E" strokeWidth="2.5" opacity=".75" />
      <path d="M0 176 H130 L186 0" stroke="#FF001E" strokeWidth="2.5" opacity=".45" />
      <path d="M0 202 H148 L212 0" stroke="#FFAA00" strokeWidth="2.5" opacity=".8" />
    </svg>
  )
}

export function FinalCta() {
  return (
    <section id="contato" aria-labelledby="cta-title" className="relative py-20 sm:py-28">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[28px] border border-white/[0.08] bg-[radial-gradient(90%_120%_at_50%_0%,#1a2257_0%,#0d1232_55%,#080b20_100%)] px-6 py-20 text-center sm:px-12 sm:py-28">
          <BrandLines className="absolute -top-6 -left-6 -z-10 w-40 sm:w-56" />
          <BrandLines className="absolute -right-6 -bottom-6 -z-10 w-40 rotate-180 sm:w-56" />
          <h2 id="cta-title" className="display mx-auto max-w-4xl text-[2.9rem] text-cream sm:text-7xl lg:text-[6rem]">
            <WordReveal text="A primeira impressão" />
            <br />
            <WordReveal text="da sua casa" delay={0.12} />
            <br />
            <WordReveal text="começa na mesa." className="text-gold" delay={0.24} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-7 max-w-lg text-[1.08rem] leading-relaxed text-mist">
              Vamos desenhar um cardápio com a cara do seu estabelecimento e deixar você no controle do conteúdo.
            </p>
          </Reveal>
          <Reveal delay={0.3} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SplitButton href={whatsappHref('demo')} className="w-full justify-between sm:w-auto">
              Solicitar demonstração
            </SplitButton>
            <OutlineButton href={appPath(`/table/${LA_BRASA_SLUG}`)} className="w-full sm:w-auto" icon={<ArrowUpRight className="size-4" aria-hidden />}>
              Ver cardápio de exemplo
            </OutlineButton>
          </Reveal>
          <Reveal delay={0.35} className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-mist">
            <a href={whatsappHref('general')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cream">
              <WhatsAppLogo className="size-5" /> WhatsApp {WHATSAPP_DISPLAY}
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cream">
              <InstagramLogo className="size-[18px]" /> {INSTAGRAM_HANDLE}
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cream">
              <GitHubLogo className="size-[18px]" /> {GITHUB_HANDLE}
            </a>
            {CONTACT_EMAIL && (
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 hover:text-cream">
                <Mail className="size-4 text-gold" aria-hidden /> {CONTACT_EMAIL}
              </a>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

type FooterLink = { label: string; href?: string; to?: string; external?: boolean }

const columns: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: 'Produto',
    links: [
      { label: 'Demonstração', href: '/#demonstracao' },
      { label: 'Benefícios', href: '/#beneficios' },
      { label: 'Como funciona', href: '/#como-funciona' },
      { label: 'Investimento', href: '/#investimento' },
      { label: 'Dúvidas', href: '/#duvidas' },
    ],
  },
  {
    title: 'Acesso',
    links: [
      { label: 'Entrar no painel', to: '/entrar' },
      { label: 'Cardápio La Brasa', to: `/table/${LA_BRASA_SLUG}` },
      { label: 'Cardápio Casa Maré', to: `/table/${DEMO_SLUG}` },
      { label: 'Demo Starbucks', to: `/table/${STARBUCKS_SLUG}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Política de Privacidade', to: '/privacidade' },
      { label: 'Política de Cookies', to: '/cookies' },
      { label: 'Termos de Uso', to: '/termos' },
    ],
  },
]

const contacts: Array<{ label: string; value: string; href: string; icon: ReactNode; external: boolean }> = [
  { label: 'WhatsApp', value: WHATSAPP_DISPLAY, href: whatsappHref('general'), icon: <WhatsAppLogo className="size-6" />, external: true },
  { label: 'Instagram', value: INSTAGRAM_HANDLE, href: INSTAGRAM_URL, icon: <InstagramLogo className="size-[22px]" />, external: true },
  { label: 'GitHub', value: GITHUB_HANDLE, href: GITHUB_URL, icon: <GitHubLogo className="size-[22px]" />, external: true },
  ...(CONTACT_EMAIL
    ? [{ label: 'E-mail', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, icon: <Mail className="size-[18px] text-gold" aria-hidden />, external: false }]
    : []),
]

const linkClass ='inline-flex min-h-8 items-center text-[0.95rem] text-mist transition-colors hover:text-cream'

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-navy-950/40 pt-16 pb-10">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.6fr))_minmax(0,1fr)] lg:gap-8">
          <div>
            <Logo variant="horizontal" className="h-10 w-auto" />
            <p className="mt-5 max-w-xs text-[0.97rem] leading-relaxed text-mist">
              Cardápios digitais exclusivos, atualizados por você e acessados por QR Code.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:contents">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="eyebrow text-dim">{col.title}</p>
                <ul className="mt-4 grid gap-1">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.to ? (
                        <Link to={l.to} className={linkClass}>
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className={linkClass}>
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div>
            <p className="eyebrow text-dim">Contato comercial</p>
            <ul className="mt-3 grid divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {contacts.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    target={c.external ? '_blank' : undefined}
                    rel={c.external ? 'noreferrer' : undefined}
                    aria-label={`${c.label}: ${c.value}${c.external ? ' (abre em nova aba)' : ''}`}
                    className="group -mx-2 flex min-h-12 items-center gap-3 rounded-[3px] px-2 py-2.5 transition-colors duration-200 hover:bg-white/[0.035] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-gold"
                  >
                    <span className="grid size-6 shrink-0 place-items-center">{c.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.7rem] font-medium tracking-[0.12em] text-dim uppercase">{c.label}</span>
                      <span className="block truncate text-[0.95rem] text-cream tabular">{c.value}</span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-dim transition-[color,transform] duration-300 ease-[var(--ease-out-quint)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-6 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-dim">© {new Date().getFullYear()} Or7 Table · Um produto Or7.dev · Todos os direitos reservados.</p>
          <Or7Signature className="w-[220px] opacity-80" />
        </div>
      </Container>
    </footer>
  )
}

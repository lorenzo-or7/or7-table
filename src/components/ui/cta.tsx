/**
 * Sistema de CTAs da landing page:
 *  01 Editorial Square  — CTA principal: bloco reto, cantos de acabamento animados.
 *  02 Outline Technical — ação secundária estratégica: contorno fino + feixe de luz na borda.
 *  03 Split Action      — ação comercial: rótulo + bloco de ícone, como um botão de duas peças.
 * Todos funcionam como <a> (links internos usam React Router).
 */
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { WhatsAppLogo } from '@/components/brand/WhatsApp'
import { cn } from './primitives'

type Size = 'md' | 'lg'

interface BaseProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  size?: Size
  children: ReactNode
}

function Anchor({ href, className, children, ...rest }: BaseProps & { className?: string }) {
  const external = /^https?:\/\//.test(href)
  if (!external && href.startsWith('/')) {
    return (
      <Link to={href} className={className} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
      {children}
    </a>
  )
}

const heights: Record<Size, string> = { md: 'h-11 text-[0.95rem]', lg: 'h-[52px] text-base' }

/** 01 — Editorial Square */
export function EditorialButton({ size = 'lg', className, children, icon = <ArrowUpRight className="size-4" aria-hidden />, ...rest }: BaseProps & { icon?: ReactNode }) {
  return (
    <Anchor
      {...rest}
      className={cn(
        'btn-editorial group inline-flex items-center justify-center gap-3 rounded-[3px] bg-gold px-6 font-semibold text-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_14px_34px_-16px_rgb(255_170_0/0.7)] transition-colors duration-200 hover:bg-gold-soft active:translate-y-px',
        heights[size],
        className,
      )}
    >
      <span className="corner tl" aria-hidden />
      <span className="corner tr" aria-hidden />
      <span className="corner bl" aria-hidden />
      <span className="corner br" aria-hidden />
      {children}
      <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">{icon}</span>
    </Anchor>
  )
}

/** 02 — Outline Technical */
export function OutlineButton({
  size = 'lg',
  className,
  children,
  icon,
  active,
  ...rest
}: BaseProps & { icon?: ReactNode; active?: boolean }) {
  return (
    <Anchor
      {...rest}
      data-active={active ? 'true' : undefined}
      className={cn(
        'beam group inline-flex items-center justify-center gap-3 rounded-[3px] border border-white/18 bg-white/[0.025] px-5 font-[family-name:var(--font-ui)] font-medium tracking-[0.06em] text-cream uppercase transition-colors duration-200 hover:border-white/30 hover:bg-white/[0.05]',
        size === 'lg' ? 'h-[52px] text-[0.8rem]' : 'h-11 text-[0.75rem]',
        className,
      )}
    >
      {children}
      {icon && <span className="text-gold transition-transform duration-300 group-hover:translate-x-0.5">{icon}</span>}
    </Anchor>
  )
}

/** 03 — Split Action (contato comercial) */
export function SplitButton({
  size = 'lg',
  className,
  children,
  icon = <WhatsAppLogo className="size-[22px]" />,
  tone = 'gold',
  ...rest
}: BaseProps & { icon?: ReactNode; tone?: 'gold' | 'dark' }) {
  return (
    <Anchor
      {...rest}
      className={cn(
        'group inline-flex items-stretch overflow-hidden rounded-[3px] font-semibold transition-[box-shadow,transform,background-color] duration-200 active:translate-y-px active:shadow-none',
        tone === 'gold'
          ? 'bg-gold text-navy-950 shadow-[0_14px_34px_-16px_rgb(255_170_0/0.75)] hover:bg-gold-soft hover:shadow-[0_18px_40px_-14px_rgb(255_170_0/0.85)]'
          : 'border border-white/14 bg-navy-800 text-cream hover:border-white/25',
        heights[size],
        className,
      )}
    >
      <span className="relative flex items-center px-5 sm:px-6">
        {children}
        {/* sublinhado editorial que cresce no hover */}
        <span aria-hidden className="absolute bottom-[30%] left-5 h-px w-[calc(100%-2.5rem)] origin-left scale-x-0 bg-current opacity-40 transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:scale-x-100 sm:left-6 sm:w-[calc(100%-3rem)]" />
      </span>
      {/* bloco do ícone: o símbolo oficial (PNG transparente) sobre um tom escuro da própria peça, sem placa branca */}
      <span
        className={cn(
          'relative flex w-[52px] shrink-0 items-center justify-center border-l transition-colors duration-200',
          tone === 'gold' ? 'border-navy-950/15 bg-navy-950/[0.08] group-hover:bg-navy-950/[0.12]' : 'border-white/10 bg-white/[0.04]',
          size === 'md' && 'w-11',
        )}
      >
        <span className="transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:-translate-y-px group-hover:scale-110 group-active:scale-100">{icon}</span>
      </span>
    </Anchor>
  )
}

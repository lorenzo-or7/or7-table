import { useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { LogOut } from 'lucide-react'
import { Sidebar, SidebarBody, SidebarLink, useSidebar, type SidebarLinkItem } from '@/components/ui/sidebar'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/components/ui/primitives'
import { useAuth } from '@/lib/auth'
import { initials } from '@/lib/format'
import { friendlyError } from '@/lib/supabase'

function SidebarLogo({ home }: { home: string }) {
  const { open, animate } = useSidebar()
  const expanded = animate ? open : true
  return (
    <Link to={home} className="relative flex h-10 items-center gap-2 rounded-lg px-1.5" aria-label="Or7 Table — início do painel">
      <AnimatePresence initial={false} mode="wait">
        {expanded ? (
          <motion.span key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <Logo variant="horizontal" className="h-8 w-auto" priority />
          </motion.span>
        ) : (
          <motion.span key="mark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <Logo variant="icon" className="w-8" priority />
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

function SidebarSlot({ children }: { children: ReactNode }) {
  const { open, animate } = useSidebar()
  const expanded = animate ? open : true
  return (
    <motion.div animate={{ opacity: expanded ? 1 : 0 }} transition={{ duration: 0.15 }} className={cn('mt-6', !expanded && 'pointer-events-none')} aria-hidden={!expanded}>
      {children}
    </motion.div>
  )
}

function SidebarProfile({ subtitle }: { subtitle: string }) {
  const { profile, signOut } = useAuth()
  const { open, animate } = useSidebar()
  const navigate = useNavigate()
  const expanded = animate ? open : true
  const name = profile?.full_name || profile?.email || 'Conta'
  return (
    <div className="border-t border-white/[0.06] pt-3">
      <div className="flex h-12 items-center gap-3 rounded-xl px-1.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-sm font-semibold text-navy-950">
          {initials(profile?.full_name || profile?.email)}
        </span>
        <motion.div
          animate={{ opacity: expanded ? 1 : 0, display: expanded ? 'block' : 'none' }}
          transition={{ duration: 0.15 }}
          className="min-w-0 flex-1"
        >
          <p className="truncate text-sm font-medium text-cream">{name}</p>
          <p className="truncate text-xs text-dim">{subtitle}</p>
        </motion.div>
      </div>
      <button
        type="button"
        onClick={async () => {
          await signOut()
          navigate('/entrar', { replace: true })
        }}
        className="group/sidebar mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-mist transition-colors hover:bg-red/10 hover:text-red-soft"
      >
        <LogOut className="size-[1.15rem] shrink-0" aria-hidden />
        <motion.span animate={{ opacity: expanded ? 1 : 0, display: expanded ? 'inline-block' : 'none' }} className="text-[0.95rem] whitespace-pre">
          Sair
        </motion.span>
        {!expanded && <span className="sr-only">Sair</span>}
      </button>
    </div>
  )
}

export function PanelLayout({
  links,
  home,
  subtitle,
  context,
  outletContext,
}: {
  links: SidebarLinkItem[]
  home: string
  subtitle: string
  context?: ReactNode
  outletContext?: unknown
}) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-navy-950 md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6" mobileHeader={<Logo variant="horizontal" className="h-7 w-auto" priority />}>
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <SidebarLogo home={home} />
            {context && <SidebarSlot>{context}</SidebarSlot>}
            <div className="mt-6 flex flex-col gap-1">
              {links.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
          </div>
          <SidebarProfile subtitle={subtitle} />
        </SidebarBody>
      </Sidebar>
      <div className="flex min-h-0 flex-1 md:py-2 md:pr-2">
        <div className="thin-scrollbar relative flex-1 overflow-y-auto bg-navy-900 md:rounded-[22px] md:border md:border-white/[0.06]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-8 sm:py-9"
            >
              <Outlet context={outletContext} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  accent?: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-dim">{eyebrow}</p>}
        <h1 className="mt-2 text-[1.9rem] leading-tight font-semibold tracking-tight text-cream sm:text-[2.2rem]">
          {title} {accent && <span className="text-mist/45">{accent}</span>}
        </h1>
        {description && <p className="mt-2 max-w-2xl leading-relaxed text-mist">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function ErrorBanner({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null
  const msg = friendlyError(error)
  return (
    <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red/30 bg-red/[0.07] px-4 py-3 text-sm text-red-soft">
      <span>Não foi possível carregar os dados. {msg}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full border border-red/30 px-3 py-1 text-red-soft hover:bg-red/10">
          Tentar de novo
        </button>
      )}
    </div>
  )
}

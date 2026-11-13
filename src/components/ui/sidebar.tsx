/**
 * Sidebar animada — adaptação do componente Aceternity (SidebarProvider,
 * Sidebar, SidebarBody, DesktopSidebar, MobileSidebar, SidebarLink).
 * Mudanças em relação ao original:
 *  - next/link → NavLink do React Router (com estado ativo);
 *  - abre também por foco do teclado (focus-within) e fecha com Esc;
 *  - menu mobile com foco gerenciado, aria-expanded e bloqueio de scroll;
 *  - cores e medidas do Or7 Table.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, type NavLinkProps } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { cn } from './primitives'

export interface SidebarLinkItem {
  label: string
  href: string
  icon: ReactNode
  end?: boolean
  external?: boolean
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState
  return <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => (
  <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
    {children}
  </SidebarProvider>
)

export const SidebarBody = ({
  className,
  children,
  mobileHeader,
}: {
  className?: string
  children: ReactNode
  mobileHeader?: ReactNode
}) => (
  <>
    <DesktopSidebar className={className}>{children}</DesktopSidebar>
    <MobileSidebar className={className} header={mobileHeader}>
      {children}
    </MobileSidebar>
  </>
)

export const DesktopSidebar = ({ className, children }: { className?: string; children: ReactNode }) => {
  const { open, setOpen, animate } = useSidebar()
  const reduce = useReducedMotion()
  return (
    <motion.nav
      aria-label="Navegação principal"
      className={cn(
        'hidden h-full w-[260px] shrink-0 flex-col px-3 py-4 md:flex',
        'border-r border-white/[0.06] bg-navy-950',
        className,
      )}
      animate={{ width: animate ? (open ? 260 : 68) : 260 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false)
          ;(document.activeElement as HTMLElement | null)?.blur()
        }
      }}
    >
      {children}
    </motion.nav>
  )
}

export const MobileSidebar = ({
  className,
  children,
  header,
}: {
  className?: string
  children: ReactNode
  header?: ReactNode
}) => {
  const { open, setOpen } = useSidebar()
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('a,button')?.focus(), 60)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <div className="flex h-14 w-full shrink-0 items-center justify-between border-b border-white/[0.06] bg-navy-950/95 px-4 backdrop-blur-md md:hidden">
      <div className="min-w-0">{header}</div>
      <button
        ref={toggleRef}
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="mobile-sidebar"
        className="-mr-2 grid size-11 place-items-center rounded-full text-cream hover:bg-white/[0.06]"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>
      {createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-sidebar"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={reduce ? { opacity: 0 } : { x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: '-100%', opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn('fixed inset-0 z-[70] flex h-dvh w-full flex-col justify-between bg-navy-950 p-6 md:hidden', className)}
          >
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute top-3 right-3 z-50 grid size-11 place-items-center rounded-full text-cream hover:bg-white/[0.06]"
              onClick={() => {
                setOpen(false)
                toggleRef.current?.focus()
              }}
            >
              <X className="size-5" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </div>
  )
}

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: SidebarLinkItem
  className?: string
  onClick?: () => void
} & Omit<NavLinkProps, 'to' | 'className' | 'children'>) => {
  const { open, setOpen, animate } = useSidebar()
  const reduce = useReducedMotion()
  const showLabel = animate ? open : true

  const label = (
    <motion.span
      animate={{
        display: showLabel ? 'inline-block' : 'none',
        opacity: showLabel ? 1 : 0,
      }}
      transition={{ duration: reduce ? 0 : 0.18 }}
      className="!m-0 !p-0 whitespace-pre text-[0.95rem] transition duration-150 group-hover/sidebar:translate-x-1"
    >
      {link.label}
    </motion.span>
  )

  const classes = (active: boolean) =>
    cn(
      'group/sidebar relative flex h-11 items-center gap-3 rounded-xl px-3 text-mist transition-colors duration-150',
      'hover:bg-white/[0.05] hover:text-cream',
      active && 'bg-white/[0.07] text-cream',
      className,
    )

  const closeMobile = () => {
    if (window.matchMedia('(max-width: 767px)').matches) setOpen(false)
    onClick?.()
  }

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" aria-label={`${link.label} (abre em nova aba)`} className={classes(false)} onClick={closeMobile}>
        <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-[1.15rem]">{link.icon}</span>
        {label}
      </a>
    )
  }

  return (
    <NavLink to={link.href} end={link.end} aria-label={link.label} className={({ isActive }) => classes(isActive)} onClick={closeMobile} {...props}>
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-gold"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              aria-hidden
            />
          )}
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center [&>svg]:size-[1.15rem]',
              isActive && 'text-gold',
            )}
          >
            {link.icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

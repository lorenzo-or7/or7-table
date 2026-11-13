import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/components/ui/primitives'
import { OutlineButton, SplitButton } from '@/components/ui/cta'
import { whatsappHref } from '@/lib/site'

const links = [
  { href: '#demonstracao', label: 'Demonstração' },
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#investimento', label: 'Investimento' },
  { href: '#duvidas', label: 'Dúvidas' },
]

export function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const toggleRef = useRef<HTMLButtonElement>(null)

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  // destaca a seção visível
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1))
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting)
        if (hit) setActive(`#${hit.target.id}`)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'mx-auto mt-3 flex h-16 max-w-[1280px] items-center justify-between gap-4 rounded-full px-3 transition-[background-color,box-shadow,border-color,margin] duration-500 sm:mx-4 xl:mx-auto',
          scrolled
            ? 'mx-3 border border-white/[0.08] bg-navy-950/95 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]'
            : 'mx-3 border border-transparent',
        )}
      >
        {/* Navegação em pílula (desktop) */}
        <nav aria-label="Seções" className="hidden flex-1 lg:block">
          <ul className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={cn(
                    'relative block rounded-full px-3 py-1.5 text-[0.88rem] whitespace-nowrap transition-colors duration-200 xl:px-3.5 xl:text-[0.9rem]',
                    active === l.href ? 'text-cream' : 'text-mist hover:text-cream',
                  )}
                >
                  {active === l.href && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-white/[0.09] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Link to="/" className="shrink-0 rounded-lg pl-2 lg:pl-0" aria-label="Or7 Table — início">
          <Logo variant="horizontal" className="h-8 w-auto sm:h-9" priority />
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-2 lg:flex">
          <Link
            to="/entrar"
            className="rounded-md px-3 py-2 text-[0.92rem] text-mist underline-offset-[6px] transition-colors hover:text-cream hover:underline"
          >
            Entrar
          </Link>
          <SplitButton href={whatsappHref('demo')} size="md">
            Solicitar demonstração
          </SplitButton>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="grid size-11 place-items-center rounded-full text-cream hover:bg-white/[0.06] lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 top-[84px] bottom-3 flex flex-col overflow-y-auto rounded-3xl border border-white/[0.08] bg-navy-950 p-6 lg:hidden"
          >
            <nav aria-label="Seções">
              <ul className="flex flex-col">
                {links.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i + 0.05 }}
                  >
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="display flex items-center justify-between border-b border-white/[0.06] py-4 text-4xl text-cream"
                    >
                      {l.label}
                      <ArrowUpRight className="size-5 text-gold" aria-hidden />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="mt-auto grid gap-3 pt-8">
              <SplitButton href={whatsappHref('demo')} className="w-full justify-between" onClick={() => setOpen(false)}>
                Solicitar demonstração
              </SplitButton>
              <OutlineButton href="/entrar" className="w-full">
                Entrar no painel
              </OutlineButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

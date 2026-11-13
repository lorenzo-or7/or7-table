import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useReducedMotion } from 'motion/react'

/** Carrega uma folha de estilo (fontes do cardápio) só quando ele aparece. */
export function useStylesheet(href: string) {
  useEffect(() => {
    if (document.querySelector(`link[href="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [href])
}

/**
 * Em tela cheia, a barra de rolagem e a cor da barra do navegador assumem a
 * identidade do cliente (e voltam ao padrão Or7 ao sair).
 */
export function usePageChrome(enabled: boolean, opts: { track: string; thumb: string; hover: string; themeColor: string }) {
  const { track, thumb, hover, themeColor } = opts
  useEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    const prev = { track: root.style.getPropertyValue('--sb-track'), thumb: root.style.getPropertyValue('--sb-thumb'), hover: root.style.getPropertyValue('--sb-thumb-hover') }
    root.style.setProperty('--sb-track', track)
    root.style.setProperty('--sb-thumb', thumb)
    root.style.setProperty('--sb-thumb-hover', hover)
    root.style.setProperty('--sb-thumb-flat', thumb)
    const meta = document.querySelector('meta[name="theme-color"]')
    const prevColor = meta?.getAttribute('content')
    meta?.setAttribute('content', themeColor)
    const prevBg = document.body.style.background
    document.body.style.background = track
    return () => {
      root.style.setProperty('--sb-track', prev.track)
      root.style.setProperty('--sb-thumb', prev.thumb)
      root.style.setProperty('--sb-thumb-hover', prev.hover)
      root.style.removeProperty('--sb-thumb-flat')
      if (prevColor) meta?.setAttribute('content', prevColor)
      document.body.style.background = prevBg
    }
  }, [enabled, track, thumb, hover, themeColor])
}

/**
 * Navegação por categorias com scroll-spy. Funciona com a janela (tela cheia)
 * ou com um contêiner rolável (cardápio dentro de uma moldura).
 */
export function useCategoryScroll(ids: string[], opts: { container?: RefObject<HTMLElement | null>; embedded?: boolean; offset?: number; disabled?: boolean }) {
  const { container, embedded, offset = 64, disabled } = opts
  const reduce = useReducedMotion()
  const [active, setActive] = useState(ids[0] ?? '')
  const sections = useRef(new Map<string, HTMLElement>())
  const locked = useRef(false)
  const key = ids.join('|')

  useEffect(() => {
    if (disabled) return
    const io = new IntersectionObserver(
      (entries) => {
        if (locked.current) return
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const id = visible[0]?.target.getAttribute('data-category')
        if (id) setActive(id)
      },
      { root: embedded ? container?.current : null, rootMargin: '-30% 0px -60% 0px' },
    )
    sections.current.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key, embedded, container, disabled])

  // um callback estável por categoria (não recria refs a cada render)
  const refs = useRef(new Map<string, (el: HTMLElement | null) => void>())
  const register = useCallback((id: string) => {
    let fn = refs.current.get(id)
    if (!fn) {
      fn = (el: HTMLElement | null) => {
        if (el) sections.current.set(id, el)
        else sections.current.delete(id)
      }
      refs.current.set(id, fn)
    }
    return fn
  }, [])

  const goTo = useCallback(
    (id: string) => {
      setActive(id)
      const el = sections.current.get(id)
      if (!el) return
      locked.current = true
      window.setTimeout(() => (locked.current = false), 700)
      const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth'
      const box = container?.current
      if (embedded && box) {
        box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - offset, behavior })
      } else {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior })
      }
    },
    [container, embedded, offset, reduce],
  )

  return { active, goTo, register }
}

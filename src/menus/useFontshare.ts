import { useEffect } from 'react'

/** Carrega fontes de um cardápio exclusivo só quando ele é exibido. */
export function useFontshare(query: string) {
  useEffect(() => {
    const href = `https://api.fontshare.com/v2/css?${query}&display=swap`
    if (document.querySelector(`link[href="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [query])
}

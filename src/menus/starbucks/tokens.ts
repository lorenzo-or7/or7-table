import { assetUrl } from '@/lib/site'
import type { CSSProperties } from 'react'
/** Identidade do Starbucks Demo (demonstração conceitual não oficial). */
export const sb = {
  green: '#006241',
  house: '#1E3932',
  accent: '#00754A',
  cream: '#F2F0EB',
  mint: '#D4E9E2',
  brown: '#5C4033',
  ink: '#1c2622',
  muted: '#5d5a53',
  line: '#ddd7cb',
  paper: '#faf8f4',
}

/**
 * Tipografia (Google Fonts, licença OFL):
 *  - Brygada 1918: revival de uma serifa de livro polonesa de 1918, calorosa e pouco usada
 *    (no lugar da Fraunces, que se tornou genérica), para títulos, nomes e preços.
 *  - Bricolage Grotesque, com eixo de largura: interface, descrições e rótulos condensados.
 */
export const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..700&family=Brygada+1918:ital,wght@0,400..700;1,400..700&display=swap'

export const serif = "'Brygada 1918', Georgia, serif"
export const sans = "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif"

/** Estilo pronto da serifa editorial (o parâmetro fica por compatibilidade com as chamadas existentes). */
export const display = (_opsz = 144): CSSProperties => ({
  fontFamily: serif,
})
export const label: CSSProperties = {
  fontFamily: sans,
  fontVariationSettings: "'wdth' 75",
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

export const SIREN = assetUrl('/demo/starbucks/brand/starbucks-siren.svg')

/** Curva padrão das transições editoriais (saída longa, sem quique). */
export const ease = [0.22, 1, 0.36, 1] as const

/** Contêiner das seções em tela cheia; dentro da moldura da landing, só o respiro lateral. */
export const wrapClass = (embedded?: boolean) => (embedded ? 'px-4' : 'mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-10')



import { cn } from '@/components/ui/primitives'

/**
 * Logos oficiais Or7 Table — arquivos aprovados em /public/brand.
 * Não recolorir, distorcer ou recriar: só escolher a versão e o tamanho.
 */
const assets = {
  horizontal: { src: '/brand/or7table-horizontal.webp', w: 600, h: 147 },
  stacked: { src: '/brand/or7table-stacked.webp', w: 640, h: 383 },
  icon: { src: '/brand/or7table-icon.webp', w: 256, h: 238 },
  symbol: { src: '/brand/or7table-symbol.webp', w: 256, h: 179 },
  mono: { src: '/brand/or7table-mono.webp', w: 700, h: 443 },
} as const

export type LogoVariant = keyof typeof assets

export function Logo({
  variant = 'horizontal',
  className,
  alt = 'Or7 Table',
  priority,
}: {
  variant?: LogoVariant
  className?: string
  alt?: string
  priority?: boolean
}) {
  const a = assets[variant]
  return (
    <img
      src={a.src}
      width={a.w}
      height={a.h}
      alt={alt}
      draggable={false}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      className={cn('block select-none', !/(^|\s)([a-z]+:)?h-/.test(className ?? '') && 'h-auto', className)}
    />
  )
}

/**
 * Assinatura oficial "Or7 — Idealizado e desenvolvido por Lorenzo Orsetti".
 * Arquivo original com o fundo preto convertido em transparência (desenho intacto).
 * Em fundos claros, entra sobre uma placa escura para manter o branco da arte.
 */
export function Or7Signature({ className, surface = 'dark' }: { className?: string; surface?: 'dark' | 'light' }) {
  const img = (
    <img
      src="/brand/or7-signature-alpha.webp"
      width={720}
      height={97}
      alt="Or7 — idealizado e desenvolvido por Lorenzo Orsetti"
      loading="lazy"
      decoding="async"
      className={cn('block h-auto select-none', surface === 'dark' && className)}
    />
  )
  if (surface === 'dark') return img
  return <span className={cn('inline-block rounded-[4px] bg-[#0b0b0b] px-3 py-2', className)}>{img}</span>
}

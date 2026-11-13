import { useMemo } from 'react'
import { buildQrSvg, type QrOptions } from '@/lib/qr'
import { cn } from '@/components/ui/primitives'

export function QrSvg({
  value,
  className,
  label,
  ...opts
}: Partial<QrOptions> & { value: string; className?: string; label?: string }) {
  const svg = useMemo(
    () =>
      buildQrSvg(value, {
        foreground: opts.foreground ?? '#0F1432',
        background: opts.background ?? '#F6F1E7',
        logo: opts.logo,
        caption: opts.caption,
        margin: opts.margin ?? 2,
      }),
    [value, opts.foreground, opts.background, opts.logo, opts.caption, opts.margin],
  )
  return (
    <div
      role="img"
      aria-label={label ?? `QR Code para ${value}`}
      className={cn('[&>svg]:block [&>svg]:h-auto [&>svg]:w-full', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

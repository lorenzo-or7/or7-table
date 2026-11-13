import { assetUrl } from '@/lib/site'
import { cn } from '@/components/ui/primitives'

/**
 * Símbolos oficiais dos canais de contato, em PNG com transparência real
 * (public/brand/contact, gerados a 256 px a partir dos SVG oficiais do Wikimedia Commons).
 * Não recolorir, não colocar placa atrás, não distorcer: só escolher o tamanho.
 */
function BrandIcon({ src, className, title, w = 256, h = 256 }: { src: string; className?: string; title?: string; w?: number; h?: number }) {
  return (
    <img
      src={src}
      width={w}
      height={h}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      decoding="async"
      draggable={false}
      className={cn('inline-block shrink-0 object-contain select-none', className)}
    />
  )
}

/** Logo oficial do WhatsApp (balão verde com contorno branco). */
export function WhatsAppLogo({ className, title }: { className?: string; title?: string }) {
  return <BrandIcon src={assetUrl('/brand/contact/whatsapp.png')} className={className} title={title} />
}

/** Glifo oficial do Instagram, gradiente da marca. */
export function InstagramLogo({ className, title }: { className?: string; title?: string }) {
  return <BrandIcon src={assetUrl('/brand/contact/instagram.png')} className={className} title={title} />
}

/** Invertocat oficial do GitHub, versão branca para fundos escuros. */
export function GitHubLogo({ className, title }: { className?: string; title?: string }) {
  return <BrandIcon src={assetUrl('/brand/contact/github-white.png')} className={className} title={title} />
}

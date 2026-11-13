import { appPath } from '@/lib/site'
/**
 * Início do painel do restaurante: o que o dono precisa ver ao entrar.
 * Link público + QR Code, um resumo do cardápio e os itens esgotados para reativar com um toque.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Check, Copy, Download, ExternalLink, Images, Package, PackageX, Star, Tags } from 'lucide-react'
import { Button, ButtonLink, EmptyState, Switch } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/overlays'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import { listCategories, listProducts, setProductAvailability, useLoader } from '@/lib/data'
import { buildQrSvg, downloadBlob, svgToPng } from '@/lib/qr'
import { publicMenuUrl, qrMenuUrl } from '@/lib/site'
import { friendlyError } from '@/lib/supabase'
import { useOwner } from './OwnerLayout'

export default function OwnerHome() {
  const { establishment } = useOwner()
  const toast = useToast()
  const { data, setData, loading, error, reload } = useLoader(async () => {
    const [categories, products] = await Promise.all([listCategories(establishment.id), listProducts(establishment.id)])
    return { categories, products }
  }, [establishment.id])
  const [copied, setCopied] = useState(false)
  const link = publicMenuUrl(establishment.slug)
  const svg = useMemo(() => buildQrSvg(qrMenuUrl(establishment.slug), { foreground: '#0B1029', background: '#FFFFFF', margin: 4 }), [establishment.slug])

  const stats = useMemo(() => {
    const products = data?.products ?? []
    return {
      total: products.length,
      available: products.filter((p) => p.is_available).length,
      off: products.filter((p) => !p.is_available),
      featured: products.filter((p) => p.is_featured).length,
      categories: data?.categories.length ?? 0,
    }
  }, [data])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  const reactivate = async (id: string, name: string) => {
    setData((d) => d && { ...d, products: d.products.map((p) => (p.id === id ? { ...p, is_available: true } : p)) })
    try {
      await setProductAvailability(id, true)
      toast.success(`${name} voltou ao cardápio.`)
    } catch (e) {
      setData((d) => d && { ...d, products: d.products.map((p) => (p.id === id ? { ...p, is_available: false } : p)) })
      toast.error(friendlyError(e))
    }
  }

  const downloadQr = async (kind: 'png' | 'svg') => {
    try {
      const name = `qrcode-${establishment.slug}.${kind}`
      downloadBlob(kind === 'svg' ? new Blob([svg], { type: 'image/svg+xml' }) : await svgToPng(svg, 2048), name)
    } catch {
      toast.error('Não foi possível gerar o arquivo agora.')
    }
  }

  const tiles = [
    { label: 'Produtos', value: stats.total, icon: <Package className="size-4" />, to: '/painel/produtos' },
    { label: 'Disponíveis hoje', value: stats.available, icon: <Check className="size-4" />, to: '/painel/produtos' },
    { label: 'Destaques', value: stats.featured, icon: <Star className="size-4" />, to: '/painel/produtos' },
    { label: 'Categorias', value: stats.categories, icon: <Tags className="size-4" />, to: '/painel/categorias' },
  ]

  return (
    <>
      <PageHeader
        eyebrow={establishment.name}
        title="Início"
        description="Seu cardápio em um olhar. Tudo que você muda aqui aparece para os clientes assim que é salvo."
        actions={
          <a
            href={appPath(`/table/${establishment.slug}`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-[0.95rem] text-cream hover:bg-white/[0.09]"
          >
            <ExternalLink className="size-4 text-gold" aria-hidden /> Ver cardápio
          </a>
        }
      />
      <ErrorBanner error={error} onRetry={() => reload()} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-6">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((t) => (
              <li key={t.label}>
                <Link to={t.to} className="block rounded-2xl border border-white/[0.07] bg-navy-950/50 p-4 transition-colors hover:border-white/15">
                  <span className="flex items-center justify-between text-sm text-mist">
                    {t.label}
                    <span className="text-gold">{t.icon}</span>
                  </span>
                  <span className="mt-3 block text-[1.75rem] leading-none font-semibold text-cream tabular">{loading && !data ? '–' : t.value}</span>
                </Link>
              </li>
            ))}
          </ul>

          <section aria-labelledby="off-title" className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5">
            <h2 id="off-title" className="font-semibold text-cream">
              Esgotados agora
            </h2>
            <p className="mt-1 text-sm text-dim">Aparecem no cardápio como indisponíveis. Ligue de novo quando voltar.</p>
            {loading && !data ? (
              <div className="skeleton mt-4 h-24 rounded-xl" />
            ) : stats.off.length === 0 ? (
              <EmptyState className="mt-4" icon={<PackageX className="size-5" />} title="Nada esgotado" description="Todos os itens estão disponíveis no cardápio." />
            ) : (
              <ul className="mt-4 divide-y divide-white/[0.05]">
                {stats.off.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0 truncate text-cream">{p.name}</span>
                    <Switch size="sm" checked={false} onChange={() => reactivate(p.id, p.name)} label={`${p.name} disponível`} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="quick-title" className="grid gap-3 sm:grid-cols-3">
            <h2 id="quick-title" className="sr-only">
              Atalhos
            </h2>
            <ButtonLink to="/painel/produtos" variant="secondary" icon={<Package className="size-4" />}>
              Editar produtos
            </ButtonLink>
            <ButtonLink to="/painel/categorias" variant="secondary" icon={<Tags className="size-4" />}>
              Organizar categorias
            </ButtonLink>
            <ButtonLink to="/painel/fotografias" variant="secondary" icon={<Images className="size-4" />}>
              Trocar fotografias
            </ButtonLink>
          </section>
        </div>

        <aside aria-labelledby="share-title" className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5">
          <h2 id="share-title" className="font-semibold text-cream">
            Link e QR Code
          </h2>
          <p className="mt-1 text-sm text-dim">O endereço não muda: o QR impresso continua valendo depois de qualquer edição.</p>
          <div className="mt-5 rounded-xl bg-white p-3 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" aria-label={`QR Code do cardápio ${establishment.name}`} role="img" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate text-sm text-mist" title={link}>
              {link.replace(/^https?:\/\//, '')}
            </span>
            <Button size="sm" variant="secondary" onClick={copy} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} aria-live="polite">
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" variant="ghost" onClick={() => downloadQr('png')} icon={<Download className="size-4" />}>
              PNG
            </Button>
            <Button size="sm" variant="ghost" onClick={() => downloadQr('svg')} icon={<Download className="size-4" />}>
              SVG
            </Button>
          </div>
        </aside>
      </div>
    </>
  )
}

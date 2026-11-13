import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AlertTriangle, Copy, Download, FileImage, Link2, QrCode, Store } from 'lucide-react'
import { Button, ButtonLink, EmptyState, Field, Input, Select, Switch } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/overlays'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import { QrSvg } from '@/components/landing/QrSvg'
import { listEstablishments, useLoader } from '@/lib/data'
import { buildQrSvg, contrastRatio, downloadBlob, isDarkerThan, svgToPng, toDataUrl } from '@/lib/qr'
import { isSiteUrlConfigured, publicSiteUrl, qrMenuUrl } from '@/lib/site'
import { mediaUrl } from '@/lib/supabase'

const presets = [
  { name: 'Navy', fg: '#0F1432', bg: '#FFFFFF' },
  { name: 'Preto', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Creme', fg: '#1B1A17', bg: '#F6F1E7' },
]

export default function QrCodes() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { data, loading, error, reload } = useLoader(listEstablishments, [])
  const selected = params.get('e') ?? ''
  const est = data?.find((e) => e.id === selected)

  const [fg, setFg] = useState('#0F1432')
  const [bg, setBg] = useState('#FFFFFF')
  const [caption, setCaption] = useState('')
  const [showCaption, setShowCaption] = useState(true)
  const [withLogo, setWithLogo] = useState(true)
  const [logoData, setLogoData] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [exporting, setExporting] = useState<'png' | 'svg' | null>(null)

  useEffect(() => {
    if (!selected && data?.length) setParams({ e: data[0]!.id }, { replace: true })
  }, [selected, data, setParams])

  useEffect(() => {
    setCaption(est ? `${est.name} · cardápio digital` : '')
    setLogoData(null)
    setLogoError(false)
    const url = mediaUrl(est?.logo_path)
    if (!url) return
    let active = true
    toDataUrl(url)
      .then((d) => active && setLogoData(d))
      .catch(() => active && setLogoError(true))
    return () => {
      active = false
    }
  }, [est])

  const url = est ? qrMenuUrl(est.slug) : ''
  const ratio = contrastRatio(fg, bg)
  const inverted = !isDarkerThan(fg, bg)
  const logo = withLogo ? logoData : null
  const cap = showCaption && caption.trim() ? caption.trim() : null
  const svg = useMemo(() => (url ? buildQrSvg(url, { foreground: fg, background: bg, logo, caption: cap, margin: 4 }) : ''), [url, fg, bg, logo, cap])

  const exportAs = async (kind: 'png' | 'svg') => {
    if (!est) return
    setExporting(kind)
    try {
      const filename = `qrcode-${est.slug}.${kind}`
      if (kind === 'svg') downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), filename)
      else downloadBlob(await svgToPng(svg, 2048), filename)
      toast.success(`Arquivo ${filename} gerado.`)
    } catch {
      toast.error('Não foi possível exportar. Tente sem a logo.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Impressão"
        title="QR Codes"
        description="O código aponta para o endereço permanente do cardápio. O conteúdo pode mudar à vontade sem reimprimir."
      />
      <ErrorBanner error={error} onRetry={() => reload()} />
      {!isSiteUrlConfigured && (
        <div role="status" className="mb-6 flex gap-3 rounded-2xl border border-gold/30 bg-gold/[0.07] p-4 text-sm leading-relaxed text-gold-soft">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong>Domínio definitivo não configurado.</strong> Os códigos estão usando o endereço atual ({publicSiteUrl()}). Defina{' '}
            <code className="font-[family-name:var(--font-ui)] text-xs">VITE_PUBLIC_SITE_URL</code> antes de gerar arquivos para impressão.
          </p>
        </div>
      )}
      {loading && !data ? (
        <div className="skeleton h-[480px] rounded-2xl" />
      ) : !data?.length ? (
        <EmptyState
          icon={<Store className="size-5" />}
          title="Nenhum estabelecimento"
          description="Cadastre um estabelecimento para gerar o QR Code."
          action={<ButtonLink to="/admin/estabelecimentos?novo=1">Cadastrar estabelecimento</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid grid-cols-1 content-start gap-6 rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6">
            <Field label="Estabelecimento">
              {(id) => (
                <Select id={id} value={selected} onChange={(e) => setParams({ e: e.target.value })}>
                  {data.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {e.is_active ? '' : ' (inativo)'}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium text-cream/90">Endereço gravado no código</p>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-navy-950/70 px-3.5 py-2.5">
                <Link2 className="size-4 shrink-0 text-gold" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-ui)] text-sm text-cream">{url}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Endereço copiado.'))}
                  aria-label="Copiar endereço"
                  className="grid size-8 place-items-center rounded-full text-mist hover:bg-white/[0.06] hover:text-cream"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              {est && !est.is_active && <p className="mt-2 text-xs text-gold-soft">Este estabelecimento está inativo: o código abre a página “indisponível”.</p>}
            </div>

            <fieldset>
              <legend className="mb-3 text-sm font-medium text-cream/90">Cores</legend>
              <div className="mb-4 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setFg(p.fg)
                      setBg(p.bg)
                    }}
                    aria-pressed={fg === p.fg && bg === p.bg}
                    className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-mist hover:text-cream aria-pressed:border-gold/40 aria-pressed:text-cream"
                  >
                    <span className="flex -space-x-1" aria-hidden>
                      <i className="size-4 rounded-full ring-1 ring-white/20" style={{ background: p.fg }} />
                      <i className="size-4 rounded-full ring-1 ring-white/20" style={{ background: p.bg }} />
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { label: 'Cor do código', value: fg, set: setFg },
                  { label: 'Cor de fundo', value: bg, set: setBg },
                ].map((c) => (
                  <label key={c.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-950/70 p-2 pr-3">
                    <input type="color" value={c.value} onChange={(e) => c.set(e.target.value.toUpperCase())} className="size-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-dim">{c.label}</span>
                      <span className="font-[family-name:var(--font-ui)] text-sm text-cream">{c.value}</span>
                    </span>
                  </label>
                ))}
              </div>
              {(ratio < 4.5 || inverted) && (
                <p role="alert" className="mt-3 flex gap-2 text-sm text-red-soft">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {inverted
                    ? 'O código precisa ser mais escuro que o fundo. Muitos leitores não reconhecem cores invertidas.'
                    : `Contraste baixo (${ratio.toFixed(1)}:1). Use pelo menos 4,5:1 para leitura confiável.`}
                </p>
              )}
            </fieldset>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-cream">Identificação abaixo do código</p>
                  <p className="text-sm text-dim">Ex.: nome da casa, número da mesa.</p>
                </div>
                <Switch checked={showCaption} onChange={setShowCaption} label="Mostrar identificação" />
              </div>
              {showCaption && (
                <Field label="Texto" hint={`${caption.length}/40`}>
                  {(id, d) => <Input id={id} aria-describedby={d} value={caption} maxLength={40} onChange={(e) => setCaption(e.target.value)} />}
                </Field>
              )}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-cream">Logo no centro</p>
                  <p className="text-sm text-dim">
                    {!est?.logo_path
                      ? 'Envie a logo em Estabelecimentos para usar aqui.'
                      : logoError
                        ? 'Não foi possível carregar a logo.'
                        : 'Usa correção de erro alta para manter a leitura.'}
                  </p>
                </div>
                <Switch checked={withLogo && Boolean(logoData)} onChange={setWithLogo} label="Logo no centro" disabled={!logoData} />
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6">
              <div className="mx-auto max-w-[340px] overflow-hidden rounded-xl shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]">
                {url ? (
                  <div className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label={`Prévia do QR Code para ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
                ) : (
                  <QrSvg value="https://or7.dev" />
                )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button icon={<Download className="size-4" />} loading={exporting === 'png'} onClick={() => exportAs('png')} disabled={!est}>
                  PNG 2048px
                </Button>
                <Button variant="secondary" icon={<FileImage className="size-4" />} loading={exporting === 'svg'} onClick={() => exportAs('svg')} disabled={!est}>
                  SVG vetorial
                </Button>
              </div>
              <p className="mt-4 flex gap-2 text-xs leading-relaxed text-dim">
                <QrCode className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Para impressão, prefira o SVG ou o PNG com no mínimo 3 cm de lado. Teste a leitura com a câmera antes de imprimir em quantidade.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

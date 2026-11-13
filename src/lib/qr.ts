import QRCode from 'qrcode'

export interface QrOptions {
  foreground: string
  background: string
  /** Logo central (data URL ou URL com CORS liberado). */
  logo?: string | null
  /** Texto de identificação abaixo do código. */
  caption?: string | null
  margin?: number
}

/** Gera o SVG do QR Code (módulos quadrados = leitura mais confiável). */
export function buildQrSvg(text: string, opts: QrOptions) {
  const ecc = opts.logo ? 'H' : 'M'
  const qr = QRCode.create(text, { errorCorrectionLevel: ecc })
  const size = qr.modules.size
  const margin = opts.margin ?? 4
  const cell = 10
  const dim = (size + margin * 2) * cell
  const captionH = opts.caption ? 78 : 0
  const h = dim + captionH

  let path = ''
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.modules.get(x, y)) {
        path += `M${(x + margin) * cell} ${(y + margin) * cell}h${cell}v${cell}h-${cell}z`
      }
    }
  }

  let logo = ''
  if (opts.logo) {
    // área central de ~22% — dentro da tolerância do nível H
    const box = Math.round(dim * 0.22)
    const pad = Math.round(box * 0.12)
    const pos = (dim - box) / 2
    logo = `<rect x="${pos - pad}" y="${pos - pad}" width="${box + pad * 2}" height="${box + pad * 2}" rx="${pad * 1.4}" fill="${opts.background}"/>
<image href="${escapeXml(opts.logo)}" x="${pos}" y="${pos}" width="${box}" height="${box}" preserveAspectRatio="xMidYMid meet"/>`
  }

  // fonte reduz conforme o tamanho do texto para caber na largura do código
  const fontSize = opts.caption ? Math.min(34, Math.floor((dim * 0.88) / (opts.caption.length * 0.58))) : 0
  const caption = opts.caption
    ? `<text x="${dim / 2}" y="${dim + 18 + fontSize * 0.6}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${opts.foreground}">${escapeXml(opts.caption)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${h}" width="${dim}" height="${h}" shape-rendering="crispEdges">
<rect width="${dim}" height="${h}" fill="${opts.background}"/>
<path d="${path}" fill="${opts.foreground}"/>
${logo}
${caption}
</svg>`
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!)
}

/** Converte SVG em PNG no navegador, na largura desejada (impressão: 2048px). */
export async function svgToPng(svg: string, width = 2048): Promise<Blob> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Não foi possível gerar a imagem.'))
      img.src = url
    })
    const ratio = img.naturalHeight / img.naturalWidth || 1
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = Math.round(width * ratio)
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao exportar PNG.'))), 'image/png'),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Busca uma imagem e devolve data URL (para embutir a logo no SVG exportado). */
export async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error('Logo indisponível.')
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Contraste WCAG entre duas cores hex. */
export function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    const v = hex.replace('#', '')
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const c = parseInt(full.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!
  }
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1! + 0.05) / (l2! + 0.05)
}

export function isDarkerThan(fg: string, bg: string) {
  const l = (hex: string) => {
    const v = hex.replace('#', '')
    return parseInt(v.slice(0, 2), 16) * 0.299 + parseInt(v.slice(2, 4), 16) * 0.587 + parseInt(v.slice(4, 6), 16) * 0.114
  }
  return l(fg) < l(bg)
}

import { useMemo, useRef, useState } from 'react'
import { ImageOff, ImagePlus, Images, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react'
import { Badge, EmptyState, cn } from '@/components/ui/primitives'
import { ConfirmDialog, useToast } from '@/components/ui/overlays'
import { ACCEPTED_IMAGES, removeMedia, setProductImage, uploadMedia, validateImage } from '@/lib/data'
import { productImage } from '@/lib/public-menu'
import { friendlyError } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { ErrorBanner } from './PanelLayout'
import { ListSkeleton, useMenuData } from './ProductsManager'

export function PhotosManager({ establishmentId }: { establishmentId: string }) {
  const toast = useToast()
  const { data, setData, loading, error, reload } = useMenuData(establishmentId)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<Product | null>(null)
  const [onlyMissing, setOnlyMissing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const targetRef = useRef<Product | null>(null)

  const products = data?.products ?? []
  const missing = products.filter((p) => !p.image_path).length
  const visible = useMemo(() => (onlyMissing ? products.filter((p) => !p.image_path) : products), [products, onlyMissing])

  const replace = (p: Product) => {
    targetRef.current = p
    inputRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    const p = targetRef.current
    if (!file || !p) return
    const problem = validateImage(file)
    if (problem) {
      toast.error(problem)
      return
    }
    setBusyId(p.id)
    let uploaded: string | null = null
    try {
      uploaded = await uploadMedia(establishmentId, 'products', file)
      await setProductImage(p.id, uploaded)
      await removeMedia([p.image_path]).catch(() => {})
      setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, image_path: uploaded } : x)) })
      toast.success(`Foto de ${p.name} atualizada.`)
    } catch (err) {
      if (uploaded) await removeMedia([uploaded]).catch(() => {})
      toast.error(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  const confirmRemove = async () => {
    const p = removing
    if (!p) return
    setBusyId(p.id)
    try {
      await setProductImage(p.id, null)
      await removeMedia([p.image_path]).catch(() => {})
      setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, image_path: null } : x)) })
      toast.success('Foto removida.')
      setRemoving(null)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  if (loading && !data) return <ListSkeleton rows={4} />

  return (
    <div>
      <ErrorBanner error={error} onRetry={() => reload()} />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {products.length === 0 ? (
        <EmptyState icon={<Images className="size-5" />} title="Nenhum produto ainda" description="Cadastre produtos para adicionar fotografias a eles." />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-mist">
              {missing === 0 ? 'Todos os produtos têm foto.' : `${missing} ${missing === 1 ? 'produto está' : 'produtos estão'} sem foto.`}
            </p>
            {missing > 0 && (
              <button
                type="button"
                aria-pressed={onlyMissing}
                onClick={() => setOnlyMissing((v) => !v)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  onlyMissing ? 'border-gold/40 bg-gold/10 text-gold-soft' : 'border-white/10 text-mist hover:text-cream',
                )}
              >
                Mostrar só os sem foto
              </button>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => {
              const src = productImage(p.image_path, 500)
              const busy = busyId === p.id
              return (
                <li key={p.id} className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/40">
                  <div className="relative aspect-[4/3] overflow-hidden bg-navy-950">
                    {src ? (
                      <img src={src} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => replace(p)}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 border-b border-dashed border-white/10 text-dim transition-colors hover:text-cream"
                      >
                        <ImageOff className="size-5" aria-hidden />
                        <span className="text-sm">Adicionar foto</span>
                      </button>
                    )}
                    {busy && (
                      <div className="absolute inset-0 grid place-items-center bg-navy-950/70 backdrop-blur-sm" role="status">
                        <LoaderCircle className="size-6 animate-spin text-gold" aria-hidden />
                        <span className="sr-only">Enviando foto</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-cream">{p.name}</p>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      {src ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => replace(p)}
                            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 text-xs text-cream hover:bg-white/[0.06] disabled:opacity-50"
                          >
                            <RefreshCw className="size-3.5" aria-hidden /> Substituir
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setRemoving(p)}
                            aria-label={`Remover foto de ${p.name}`}
                            className="grid size-8 place-items-center rounded-full border border-white/10 text-mist hover:border-red/30 hover:bg-red/10 hover:text-red-soft disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </>
                      ) : (
                        <>
                          <Badge tone="gold">Sem foto</Badge>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => replace(p)}
                            aria-label={`Enviar foto de ${p.name}`}
                            className="ml-auto grid size-8 place-items-center rounded-full bg-gold text-navy-950 hover:bg-gold-soft disabled:opacity-50"
                          >
                            <ImagePlus className="size-3.5" aria-hidden />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-6 text-sm text-dim">Formatos aceitos: JPG, PNG e WEBP. As fotos são reduzidas e otimizadas antes do envio (até 5 MB).</p>
        </>
      )}
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        loading={busyId === removing?.id}
        title="Remover foto?"
        description={`O produto ${removing?.name ?? ''} continua no cardápio, apenas sem fotografia.`}
        confirmLabel="Remover foto"
      />
    </div>
  )
}

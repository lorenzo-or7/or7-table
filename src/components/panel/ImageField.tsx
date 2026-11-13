import { useEffect, useId, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/components/ui/primitives'
import { ACCEPTED_IMAGES, validateImage } from '@/lib/data'
import { productImage } from '@/lib/public-menu'

/**
 * Seleção de foto com prévia. Não envia nada sozinho: devolve o arquivo
 * escolhido (ou a remoção) para o formulário salvar junto com o produto.
 */
export function ImageField({
  currentPath,
  file,
  removed,
  onFile,
  onRemove,
  label = 'Fotografia',
  aspect = 'aspect-[4/3]',
}: {
  currentPath: string | null
  file: File | null
  removed: boolean
  onFile: (f: File | null) => void
  onRemove: () => void
  label?: string
  aspect?: string
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shown = preview ?? (removed ? null : productImage(currentPath, 700))

  const pick = (f: File | undefined | null) => {
    if (!f) return
    const problem = validateImage(f)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    onFile(f)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-cream/90" id={`${id}-label`}>
        {label}
      </span>
      <div
        className={cn(
          'group relative overflow-hidden rounded-2xl border transition-colors',
          aspect,
          dragging ? 'border-gold bg-gold/[0.06]' : 'border-white/10 bg-navy-950/70',
          !shown && 'border-dashed',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          pick(e.dataTransfer.files?.[0])
        }}
      >
        {shown ? (
          <>
            <img src={shown} alt="Prévia da foto" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cream/95 px-3.5 text-sm font-medium text-navy-950 hover:bg-white"
              >
                <RefreshCw className="size-3.5" aria-hidden /> Trocar
              </button>
              <button
                type="button"
                onClick={() => {
                  onFile(null)
                  onRemove()
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/50 px-3.5 text-sm text-white backdrop-blur hover:bg-red/80"
              >
                <Trash2 className="size-3.5" aria-hidden /> Remover
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-describedby={`${id}-hint`}
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-mist transition-colors hover:text-cream"
          >
            <span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-gold">
              <ImagePlus className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium">Adicionar foto</span>
            <span id={`${id}-hint`} className="text-xs text-dim">
              JPG, PNG ou WEBP · arraste ou toque para escolher
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGES.join(',')}
          className="sr-only"
          aria-labelledby={`${id}-label`}
          tabIndex={-1}
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-soft">
          {error}
        </p>
      ) : (
        <p className="text-xs text-dim">A foto é otimizada automaticamente antes do envio.</p>
      )}
    </div>
  )
}

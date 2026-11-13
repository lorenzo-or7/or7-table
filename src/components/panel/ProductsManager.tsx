import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ImageOff, Package, Pencil, Plus, Search, Star, Tags, Trash2 } from 'lucide-react'
import { Button, EmptyState, Field, IconButton, Input, Select, Switch, Textarea, cn } from '@/components/ui/primitives'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlays'
import {
  deleteProduct,
  listCategories,
  listProducts,
  removeMedia,
  saveProduct,
  setProductAvailability,
  setProductFeatured,
  uploadMedia,
  useLoader,
} from '@/lib/data'
import { formatBRL, parseBRL, priceToInput } from '@/lib/format'
import { productImage } from '@/lib/public-menu'
import { friendlyError } from '@/lib/supabase'
import type { Category, Product, ProductVariant } from '@/lib/types'
import { ErrorBanner } from './PanelLayout'
import { ImageField } from './ImageField'

export function useMenuData(establishmentId: string) {
  return useLoader(async () => {
    const [categories, products] = await Promise.all([listCategories(establishmentId), listProducts(establishmentId)])
    return { categories, products }
  }, [establishmentId])
}

export function ProductsManager({ establishmentId, onGoToCategories }: { establishmentId: string; onGoToCategories?: () => void }) {
  const toast = useToast()
  const { data, setData, loading, error, reload } = useMenuData(establishmentId)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [busyDelete, setBusyDelete] = useState(false)

  const categories = data?.categories ?? []
  const products = data?.products ?? []

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(
      (p) => (filter === 'all' || p.category_id === filter) && (!q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)),
    )
  }, [products, query, filter])

  const grouped = useMemo(
    () =>
      categories
        .map((c) => ({ category: c, items: visible.filter((p) => p.category_id === c.id) }))
        .filter((g) => g.items.length > 0),
    [categories, visible],
  )

  const toggle = async (p: Product, next: boolean) => {
    setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, is_available: next } : x)) })
    try {
      await setProductAvailability(p.id, next)
      toast.success(next ? `${p.name} voltou ao cardápio.` : `${p.name} marcado como esgotado.`)
    } catch (e) {
      setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, is_available: !next } : x)) })
      toast.error(friendlyError(e))
    }
  }

  const toggleFeatured = async (p: Product) => {
    const next = !p.is_featured
    setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, is_featured: next } : x)) })
    try {
      await setProductFeatured(p.id, next)
      toast.success(next ? `${p.name} agora é destaque.` : `${p.name} saiu dos destaques.`)
    } catch (e) {
      setData((d) => d && { ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, is_featured: !next } : x)) })
      toast.error(friendlyError(e))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusyDelete(true)
    try {
      await deleteProduct(deleting)
      setData((d) => d && { ...d, products: d.products.filter((x) => x.id !== deleting.id) })
      toast.success('Produto excluído.')
      setDeleting(null)
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setBusyDelete(false)
    }
  }

  if (loading && !data) return <ListSkeleton />

  return (
    <div>
      <ErrorBanner error={error} onRetry={() => reload()} />

      {categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="size-5" />}
          title="Crie uma categoria primeiro"
          description="Os produtos ficam organizados em categorias, como Entradas, Pratos e Bebidas."
          action={onGoToCategories && <Button onClick={onGoToCategories}>Criar categorias</Button>}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Buscar produto</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-dim" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou descrição" className="pl-10" />
            </label>
            <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')} className="lg:order-last">
              Novo produto
            </Button>
          </div>
          <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por categoria">
            {[{ id: 'all', name: 'Todas' } as Pick<Category, 'id' | 'name'>, ...categories].map((c) => {
              const count = c.id === 'all' ? products.length : products.filter((p) => p.category_id === c.id).length
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={filter === c.id}
                  onClick={() => setFilter(c.id)}
                  className={cn(
                    'shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors',
                    filter === c.id ? 'border-gold/40 bg-gold/10 text-gold-soft' : 'border-white/[0.08] text-mist hover:border-white/20 hover:text-cream',
                  )}
                >
                  {c.name} <span className="ml-1 text-xs opacity-70">{count}</span>
                </button>
              )
            })}
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="size-5" />}
              title="Nenhum produto cadastrado"
              description="Cadastre o primeiro produto com nome, preço e foto. Ele aparece no cardápio assim que você salvar."
              action={<Button onClick={() => setEditing('new')}>Cadastrar produto</Button>}
            />
          ) : grouped.length === 0 ? (
            <EmptyState icon={<Search className="size-5" />} title="Nada encontrado" description="Tente outro termo ou escolha outra categoria." />
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {grouped.map(({ category, items }) => (
                <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                  <h2 id={`cat-${category.id}`} className="mb-3 flex items-baseline gap-2 text-sm font-semibold tracking-wide text-mist">
                    {category.name}
                    <span className="text-xs font-normal text-dim">{items.length}</span>
                  </h2>
                  <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/40">
                    <AnimatePresence initial={false}>
                      {items.map((p) => (
                        <motion.li
                          key={p.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4"
                        >
                          <Thumb path={p.image_path} dim={!p.is_available} />
                          <button type="button" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}, ${formatBRL(p.price)}`} className="min-w-0 flex-1 rounded-lg text-left">
                            <p className="flex items-center gap-1.5 truncate font-medium text-cream">
                              {p.is_featured && <Star className="size-3.5 shrink-0 fill-gold text-gold" aria-label="Destaque" />}
                              <span className="truncate">{p.name}</span>
                            </p>
                            <p className="truncate text-sm text-dim">{p.description || 'Sem descrição'}</p>
                            <p className="mt-0.5 text-sm text-cream/90 tabular sm:hidden">{formatBRL(p.price)}</p>
                          </button>
                          <span className="hidden w-28 text-right text-cream/90 tabular sm:block">
                            {p.variants?.length ? <span className="mr-1 text-xs text-dim">a partir de</span> : null}
                            {formatBRL(p.price)}
                          </span>
                          <div className="flex shrink-0 items-center justify-end gap-2.5 md:w-[118px]">
                            <span className={cn('hidden text-xs md:inline', p.is_available ? 'text-mint' : 'text-red-soft')}>
                              {p.is_available ? 'Disponível' : 'Esgotado'}
                            </span>
                            <Switch size="sm" checked={p.is_available} onChange={(next) => toggle(p, next)} label={`${p.name} disponível`} />
                          </div>
                          <div className="flex shrink-0">
                            <IconButton label={p.is_featured ? `Tirar ${p.name} dos destaques` : `Destacar ${p.name}`} onClick={() => toggleFeatured(p)} className="max-sm:hidden">
                              <Star className={cn('size-4', p.is_featured && 'fill-gold text-gold')} />
                            </IconButton>
                            <IconButton label={`Editar ${p.name}`} onClick={() => setEditing(p)} className="max-sm:hidden">
                              <Pencil className="size-4" />
                            </IconButton>
                            <IconButton label={`Excluir ${p.name}`} tone="danger" onClick={() => setDeleting(p)}>
                              <Trash2 className="size-4" />
                            </IconButton>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <ProductFormModal
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        open={editing !== null}
        product={editing === 'new' ? null : editing}
        categories={categories}
        establishmentId={establishmentId}
        defaultCategory={filter !== 'all' ? filter : categories[0]?.id}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          setData((d) =>
            d && {
              ...d,
              products: isNew ? [...d.products, saved] : d.products.map((x) => (x.id === saved.id ? saved : x)),
            },
          )
          toast.success(isNew ? 'Produto cadastrado. Já está no cardápio.' : 'Alterações salvas. O cardápio já foi atualizado.')
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busyDelete}
        title="Excluir produto?"
        description={
          <>
            <strong className="text-cream">{deleting?.name}</strong> sai do cardápio e não pode ser recuperado. Se for só por hoje, prefira marcar como
            esgotado.
          </>
        }
        confirmLabel="Excluir produto"
      />
    </div>
  )
}

function Thumb({ path, dim }: { path: string | null; dim?: boolean }) {
  const src = productImage(path, 160)
  return src ? (
    <img src={src} alt="" loading="lazy" className={cn('size-12 shrink-0 rounded-xl object-cover', dim && 'opacity-50 grayscale')} />
  ) : (
    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-dashed border-white/12 text-dim" title="Sem foto">
      <ImageOff className="size-4" aria-hidden />
    </span>
  )
}

type SizeRow = { label: string; ml: string; price: string }
const DEFAULT_SIZES: SizeRow[] = [
  { label: 'Tall', ml: '300', price: '' },
  { label: 'Grande', ml: '400', price: '' },
  { label: 'Venti', ml: '500', price: '' },
]

function ProductFormModal({
  open,
  product,
  categories,
  establishmentId,
  defaultCategory,
  onClose,
  onSaved,
}: {
  open: boolean
  product: Product | null
  categories: Category[]
  establishmentId: string
  defaultCategory?: string
  onClose: () => void
  onSaved: (p: Product, isNew: boolean) => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(priceToInput(product?.price))
  const [categoryId, setCategoryId] = useState(product?.category_id ?? defaultCategory ?? '')
  const [available, setAvailable] = useState(product?.is_available ?? true)
  const [featured, setFeatured] = useState(product?.is_featured ?? false)
  const [file, setFile] = useState<File | null>(null)
  const [removed, setRemoved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // preços por tamanho (opcional): ex. Tall / Grande / Venti
  const [useSizes, setUseSizes] = useState(Boolean(product?.variants?.length))
  const [sizes, setSizes] = useState<SizeRow[]>(
    product?.variants?.length
      ? product.variants.map((v) => ({ label: v.label, ml: v.volume_ml ? String(v.volume_ml) : '', price: priceToInput(v.price) }))
      : DEFAULT_SIZES.map((r) => ({ ...r })),
  )
  const updateSize = (i: number, patch: Partial<SizeRow>) => setSizes((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  // evita perder o que foi digitado: confirma antes de fechar e avisa ao sair da página
  const initial = useMemo(() => JSON.stringify({ name, description, price, categoryId, available, featured, useSizes, sizes }), []) // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = Boolean(file) || removed || JSON.stringify({ name, description, price, categoryId, available, featured, useSizes, sizes }) !== initial
  useEffect(() => {
    if (!open || !dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [open, dirty])
  const requestClose = () => {
    if (saving) return
    if (dirty && !window.confirm('Descartar as alterações que ainda não foram salvas?')) return
    onClose()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    let variants: ProductVariant[] | null = null
    if (useSizes) {
      variants = sizes
        .filter((r) => r.label.trim() || r.price.trim())
        .map((r) => ({ label: r.label.trim(), volume_ml: r.ml ? Number(r.ml) : null, price: parseBRL(r.price) ?? NaN }))
      if (!variants.length) errs.sizes = 'Inclua pelo menos um tamanho.'
      else if (variants.some((v) => !v.label || !Number.isFinite(v.price) || v.price < 0 || v.price >= 100000))
        errs.sizes = 'Cada tamanho precisa de nome e preço válido.'
    }
    const parsed = useSizes ? (variants?.length ? Math.min(...variants.map((v) => v.price)) : null) : parseBRL(price)
    if (!name.trim()) errs.name = 'Dê um nome ao produto.'
    if (!useSizes) {
      if (parsed === null) errs.price = 'Informe o preço, por exemplo 42,90.'
      else if (parsed < 0 || parsed >= 100000) errs.price = 'Preço fora do limite.'
    }
    if (!categoryId) errs.category = 'Escolha uma categoria.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    setFormError(null)
    let uploaded: string | null = null
    try {
      let image_path = removed ? null : (product?.image_path ?? null)
      if (file) {
        uploaded = await uploadMedia(establishmentId, 'products', file)
        image_path = uploaded
      }
      const saved = await saveProduct(
        establishmentId,
        {
          name: name.trim(),
          description: description.trim() || null,
          price: parsed!,
          variants: useSizes ? variants : null,
          category_id: categoryId,
          is_available: available,
          // só envia quando mudou: projetos sem a migração 0003 continuam salvando normalmente
          ...(featured !== (product?.is_featured ?? false) ? { is_featured: featured } : {}),
          image_path,
        },
        product?.id,
      )
      if (product?.image_path && product.image_path !== image_path) await removeMedia([product.image_path]).catch(() => {})
      onSaved({ ...saved, price: Number(saved.price), variants: saved.variants?.map((v) => ({ ...v, price: Number(v.price) })) ?? null }, !product)
    } catch (err) {
      if (uploaded) await removeMedia([uploaded]).catch(() => {})
      setFormError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title={product ? 'Editar produto' : 'Novo produto'}
      description={product ? 'As mudanças aparecem no cardápio assim que você salvar.' : 'Preencha o essencial. Você pode ajustar depois.'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {product ? 'Salvar alterações' : 'Cadastrar produto'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid grid-cols-1 content-start gap-5">
          <Field label="Nome" error={errors.name}>
            {(id, d) => (
              <Input
                id={id}
                aria-describedby={d}
                aria-invalid={Boolean(errors.name)}
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Moqueca de camarão"
                data-autofocus
              />
            )}
          </Field>
          <Field label="Descrição" optional hint={`${description.length}/400 · ingredientes, porção, acompanhamentos`}>
            {(id, d) => (
              <Textarea id={id} aria-describedby={d} value={description} maxLength={400} onChange={(e) => setDescription(e.target.value)} rows={3} />
            )}
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {useSizes ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-cream/90">Preço</span>
                <p className="flex h-11 items-center rounded-xl border border-white/[0.07] bg-navy-950/40 px-3.5 text-sm text-mist">Definido por tamanho, abaixo</p>
              </div>
            ) : (
            <Field label="Preço" error={errors.price}>
              {(id, d) => (
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-dim">R$</span>
                  <Input
                    id={id}
                    aria-describedby={d}
                    aria-invalid={Boolean(errors.price)}
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^\d,.]/g, ''))}
                    onBlur={() => {
                      const v = parseBRL(price)
                      if (v !== null) setPrice(priceToInput(v))
                    }}
                    placeholder="0,00"
                    className="pl-10 tabular"
                  />
                </div>
              )}
            </Field>
            )}
            <Field label="Categoria" error={errors.category}>
              {(id, d) => (
                <Select id={id} aria-describedby={d} aria-invalid={Boolean(errors.category)} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="" disabled>
                    Escolha…
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-navy-950/50 px-4 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-cream">Preços por tamanho</p>
                <p className="text-sm text-dim">Para bebidas servidas em copos de tamanhos diferentes.</p>
              </div>
              <Switch checked={useSizes} onChange={setUseSizes} label="Usar preços por tamanho" />
            </div>
            {useSizes && (
              <div className="mt-4 grid gap-2" role="group" aria-label="Tamanhos e preços">
                <div className="grid grid-cols-[minmax(0,1fr)_76px_112px_36px] gap-2 px-0.5 text-xs text-dim">
                  <span>Tamanho</span>
                  <span>ml</span>
                  <span>Preço (R$)</span>
                  <span className="sr-only">Remover</span>
                </div>
                {sizes.map((r, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_76px_112px_36px] items-center gap-2">
                    <Input aria-label={`Nome do tamanho ${i + 1}`} value={r.label} maxLength={20} onChange={(e) => updateSize(i, { label: e.target.value })} className="h-10" />
                    <Input
                      aria-label={`Volume em ml do tamanho ${i + 1}`}
                      inputMode="numeric"
                      value={r.ml}
                      onChange={(e) => updateSize(i, { ml: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      className="h-10 tabular"
                    />
                    <Input
                      aria-label={`Preço do tamanho ${i + 1}`}
                      inputMode="decimal"
                      value={r.price}
                      placeholder="0,00"
                      onChange={(e) => updateSize(i, { price: e.target.value.replace(/[^\d,.]/g, '') })}
                      onBlur={() => {
                        const v = parseBRL(r.price)
                        if (v !== null) updateSize(i, { price: priceToInput(v) })
                      }}
                      className="h-10 tabular"
                    />
                    <IconButton label={`Remover tamanho ${i + 1}`} tone="danger" onClick={() => setSizes((rows) => rows.filter((_, j) => j !== i))} disabled={sizes.length === 1}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                ))}
                {sizes.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setSizes((rows) => [...rows, { label: '', ml: '', price: '' }])}
                    className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm text-gold-soft hover:underline"
                  >
                    <Plus className="size-3.5" aria-hidden /> Adicionar tamanho
                  </button>
                )}
                {errors.sizes && (
                  <p role="alert" className="text-xs font-medium text-red-soft">
                    {errors.sizes}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-navy-950/50 px-4 py-3.5">
            <div>
              <p className="font-medium text-cream">Disponível hoje</p>
              <p className="text-sm text-dim">Desligado, o item aparece como esgotado.</p>
            </div>
            <Switch checked={available} onChange={setAvailable} label="Produto disponível" />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-navy-950/50 px-4 py-3.5">
            <div>
              <p className="font-medium text-cream">Destaque</p>
              <p className="text-sm text-dim">Cardápios com área de destaques mostram este item primeiro.</p>
            </div>
            <Switch checked={featured} onChange={setFeatured} label="Produto em destaque" />
          </div>
          {formError && (
            <p role="alert" className="rounded-xl border border-red/30 bg-red/[0.07] px-3.5 py-2.5 text-sm text-red-soft">
              {formError}
            </p>
          )}
        </div>
        <ImageField
          currentPath={product?.image_path ?? null}
          file={file}
          removed={removed}
          onFile={(f) => {
            setFile(f)
            if (f) setRemoved(false)
          }}
          onRemove={() => setRemoved(true)}
        />
      </form>
    </Modal>
  )
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3" role="status" aria-label="Carregando">
      <div className="skeleton h-11 rounded-xl" />
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] px-4 py-3.5 last:border-0">
            <div className="skeleton size-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-1/3 rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
            <div className="skeleton h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react'
import { Button, EmptyState, Field, IconButton, Input, Select } from '@/components/ui/primitives'
import { Modal, useToast } from '@/components/ui/overlays'
import {
  createCategory,
  deleteCategory,
  deleteProductsInCategory,
  moveProductsToCategory,
  renameCategory,
  reorderCategories,
} from '@/lib/data'
import { plural } from '@/lib/format'
import { friendlyError } from '@/lib/supabase'
import type { Category } from '@/lib/types'
import { ErrorBanner } from './PanelLayout'
import { ListSkeleton, useMenuData } from './ProductsManager'

export function CategoriesManager({ establishmentId }: { establishmentId: string }) {
  const toast = useToast()
  const { data, setData, loading, error, reload } = useMenuData(establishmentId)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [moving, setMoving] = useState(false)

  const categories = data?.categories ?? []
  const products = data?.products ?? []
  const countOf = (id: string) => products.filter((p) => p.category_id === id).length

  const add = async (e: FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Já existe uma categoria com esse nome.')
      return
    }
    setCreating(true)
    try {
      const created = await createCategory(establishmentId, name, categories.length)
      setData((d) => d && { ...d, categories: [...d.categories, created] })
      setNewName('')
      toast.success(`Categoria “${name}” criada.`)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setCreating(false)
    }
  }

  const saveRename = async (c: Category) => {
    const name = editName.trim()
    if (!name || name === c.name) {
      setEditingId(null)
      return
    }
    try {
      await renameCategory(c.id, name)
      setData((d) => d && { ...d, categories: d.categories.map((x) => (x.id === c.id ? { ...x, name } : x)) })
      toast.success('Categoria renomeada.')
      setEditingId(null)
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= categories.length || moving) return
    const next = [...categories]
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    const previous = categories
    setData((d) => d && { ...d, categories: next.map((c, i) => ({ ...c, position: i })) })
    setMoving(true)
    try {
      await reorderCategories(next)
    } catch (err) {
      setData((d) => d && { ...d, categories: previous })
      toast.error(friendlyError(err))
    } finally {
      setMoving(false)
    }
  }

  if (loading && !data) return <ListSkeleton rows={4} />

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div>
        <ErrorBanner error={error} onRetry={() => reload()} />
        {categories.length === 0 ? (
          <EmptyState
            icon={<Tags className="size-5" />}
            title="Nenhuma categoria ainda"
            description="Comece pelas seções do seu cardápio, como Entradas, Pratos principais, Sobremesas e Bebidas."
          />
        ) : (
          <ol className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/40" aria-label="Categorias na ordem do cardápio">
            <AnimatePresence initial={false}>
              {categories.map((c, i) => (
                <motion.li key={c.id} layout transition={{ type: 'spring', stiffness: 500, damping: 40 }} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                  <span className="w-6 text-center text-sm font-semibold text-gold tabular">{i + 1}</span>
                  {editingId === c.id ? (
                    <form
                      className="flex flex-1 items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveRename(c)
                      }}
                    >
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={60}
                        aria-label="Novo nome da categoria"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                        className="h-10"
                      />
                      <IconButton label="Salvar nome" type="submit" className="text-mint">
                        <Check className="size-4" />
                      </IconButton>
                      <IconButton label="Cancelar" onClick={() => setEditingId(null)}>
                        <X className="size-4" />
                      </IconButton>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-cream">{c.name}</p>
                        <p className="text-sm text-dim">{plural(countOf(c.id), 'produto', 'produtos')}</p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <IconButton label={`Subir ${c.name}`} onClick={() => move(i, -1)} disabled={i === 0 || moving}>
                          <ArrowUp className="size-4" />
                        </IconButton>
                        <IconButton label={`Descer ${c.name}`} onClick={() => move(i, 1)} disabled={i === categories.length - 1 || moving}>
                          <ArrowDown className="size-4" />
                        </IconButton>
                        <IconButton
                          label={`Renomear ${c.name}`}
                          onClick={() => {
                            setEditingId(c.id)
                            setEditName(c.name)
                          }}
                        >
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton label={`Excluir ${c.name}`} tone="danger" onClick={() => setDeleting(c)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
        {categories.length > 1 && <p className="mt-3 text-sm text-dim">Use as setas para definir a ordem em que as categorias aparecem no cardápio.</p>}
      </div>

      <form onSubmit={add} className="rounded-2xl border border-white/[0.07] bg-navy-950/40 p-5 lg:sticky lg:top-6">
        <p className="font-semibold text-cream">Nova categoria</p>
        <p className="mt-1 text-sm text-dim">Ela entra no fim da lista.</p>
        <Field label="Nome" className="mt-4">
          {(id) => <Input id={id} value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} placeholder="Ex.: Sobremesas" />}
        </Field>
        <Button type="submit" icon={<Plus className="size-4" />} loading={creating} disabled={!newName.trim()} className="mt-4 w-full">
          Criar categoria
        </Button>
      </form>

      <DeleteCategoryDialog
        key={deleting?.id ?? 'none'}
        category={deleting}
        productCount={deleting ? countOf(deleting.id) : 0}
        others={categories.filter((c) => c.id !== deleting?.id)}
        onClose={() => setDeleting(null)}
        onDone={(removedProducts, movedTo) => {
          const removedId = deleting!.id
          setData(
            (d) =>
              d && {
                categories: d.categories.filter((c) => c.id !== removedId),
                products: removedProducts
                  ? d.products.filter((p) => p.category_id !== removedId)
                  : d.products.map((p) => (p.category_id === removedId && movedTo ? { ...p, category_id: movedTo } : p)),
              },
          )
          setDeleting(null)
        }}
      />
    </div>
  )
}

function DeleteCategoryDialog({
  category,
  productCount,
  others,
  onClose,
  onDone,
}: {
  category: Category | null
  productCount: number
  others: Category[]
  onClose: () => void
  onDone: (removedProducts: boolean, movedTo: string | null) => void
}) {
  const toast = useToast()
  const [mode, setMode] = useState<'move' | 'delete'>(others.length ? 'move' : 'delete')
  const [target, setTarget] = useState(others[0]?.id ?? '')
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    if (!category) return
    setBusy(true)
    try {
      if (productCount > 0) {
        if (mode === 'move') await moveProductsToCategory(category.id, target)
        else await deleteProductsInCategory(category.id)
      }
      await deleteCategory(category.id)
      toast.success(
        productCount > 0 && mode === 'move'
          ? `Categoria excluída. ${plural(productCount, 'produto movido', 'produtos movidos')}.`
          : 'Categoria excluída.',
      )
      onDone(productCount > 0 && mode === 'delete', productCount > 0 && mode === 'move' ? target : null)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={category !== null}
      onClose={() => !busy && onClose()}
      size="sm"
      title={`Excluir “${category?.name ?? ''}”?`}
      description={
        productCount === 0
          ? 'Esta categoria está vazia e pode ser excluída com segurança.'
          : `Ela tem ${plural(productCount, 'produto', 'produtos')}. Escolha o que fazer com ${productCount === 1 ? 'ele' : 'eles'}.`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm} loading={busy} disabled={productCount > 0 && mode === 'move' && !target}>
            Excluir categoria
          </Button>
        </>
      }
    >
      {productCount > 0 && (
        <fieldset className="grid grid-cols-1 gap-3">
          <legend className="sr-only">O que fazer com os produtos</legend>
          {others.length > 0 && (
            <label className="flex cursor-pointer gap-3 rounded-2xl border border-white/[0.08] p-4 has-[:checked]:border-gold/40 has-[:checked]:bg-gold/[0.05]">
              <input type="radio" name="cat-mode" checked={mode === 'move'} onChange={() => setMode('move')} className="mt-1 accent-[#FFAA00]" />
              <span className="grid flex-1 gap-3">
                <span>
                  <span className="block font-medium text-cream">Mover os produtos</span>
                  <span className="text-sm text-dim">Eles continuam no cardápio, em outra categoria.</span>
                </span>
                {mode === 'move' && (
                  <Select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Categoria de destino">
                    {others.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                )}
              </span>
            </label>
          )}
          <label className="flex cursor-pointer gap-3 rounded-2xl border border-white/[0.08] p-4 has-[:checked]:border-red/40 has-[:checked]:bg-red/[0.05]">
            <input type="radio" name="cat-mode" checked={mode === 'delete'} onChange={() => setMode('delete')} className="mt-1 accent-[#FF001E]" />
            <span>
              <span className="block font-medium text-cream">Excluir os produtos também</span>
              <span className="text-sm text-dim">Produtos e fotos são apagados definitivamente.</span>
            </span>
          </label>
        </fieldset>
      )}
    </Modal>
  )
}

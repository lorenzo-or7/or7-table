/**
 * Base provisória — usada enquanto a identidade exclusiva do cliente
 * está em produção. Neutra de propósito: tipografia de sistema, sem cor de marca.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { groupByCategory, productImage, type MenuThemeProps, type PublicProduct } from '@/lib/public-menu'
import { mediaUrl } from '@/lib/supabase'
import { formatBRL } from '@/lib/format'

export default function BaseMenu({ menu, embedded }: MenuThemeProps) {
  const groups = useMemo(() => groupByCategory(menu), [menu])
  const [active, setActive] = useState(groups[0]?.category.id ?? '')
  const [selected, setSelected] = useState<PublicProduct | null>(null)
  const est = menu.establishment
  const logo = mediaUrl(est.logo_path)
  const current = groups.find((g) => g.category.id === active) ?? groups[0]

  return (
    <div
      className={`relative bg-[#FAFAF7] text-[#18181B] ${embedded ? 'h-full overflow-y-auto' : 'min-h-dvh'}`}
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto max-w-2xl">
        <header className="px-5 pt-10 pb-6 text-center">
          {logo && <img src={logo} alt="" className="mx-auto mb-4 h-16 w-auto object-contain" />}
          <h1 className="text-3xl font-semibold tracking-tight">{est.name}</h1>
          {est.tagline && <p className="mt-2 text-[15px] text-zinc-600">{est.tagline}</p>}
          {(est.opening_hours || est.address) && (
            <p className="mt-3 text-[13px] text-zinc-500">{[est.opening_hours, est.address].filter(Boolean).join(' · ')}</p>
          )}
        </header>

        <nav aria-label="Categorias" className="sticky top-0 z-10 border-y border-zinc-200 bg-[#FAFAF7]/95 backdrop-blur">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
            {groups.map(({ category }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActive(category.id)}
                aria-pressed={category.id === current?.category.id}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category.id === current?.category.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </nav>

        <AnimatePresence mode="wait">
          {current ? (
            <motion.ul
              key={current.category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="divide-y divide-zinc-200 px-4 pb-16"
            >
              {current.products.map((p) => {
                const img = productImage(p.image_path, 240)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(p)}
                      className={`flex w-full items-center gap-4 py-4 text-left ${p.is_available ? '' : 'opacity-55'}`}
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.description && <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{p.description}</p>}
                        <p className="mt-2 text-sm font-semibold tabular-nums">
                          {p.is_available ? formatBRL(p.price) : 'Indisponível no momento'}
                        </p>
                      </div>
                      {img && <img src={img} alt="" loading="lazy" className="size-20 shrink-0 rounded-xl object-cover" />}
                    </button>
                  </li>
                )
              })}
            </motion.ul>
          ) : (
            <p className="px-5 py-20 text-center text-zinc-500">O cardápio está sendo preparado.</p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && (
          <div className={`${embedded ? 'absolute' : 'fixed'} inset-0 z-50 flex items-end justify-center sm:items-center`}>
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selected.name}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
            >
              {selected.image_path && (
                <img src={productImage(selected.image_path, 900) ?? ''} alt={selected.name} className="aspect-[4/3] w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Fechar"
                className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white/90"
              >
                <X className="size-5" />
              </button>
              <div className="p-6">
                <h3 className="text-xl font-semibold">{selected.name}</h3>
                {selected.description && <p className="mt-2 text-zinc-600">{selected.description}</p>}
                <p className="mt-4 text-lg font-semibold tabular-nums">
                  {selected.is_available ? formatBRL(selected.price) : 'Indisponível no momento'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

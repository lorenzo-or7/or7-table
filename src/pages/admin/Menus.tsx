import { appPath } from '@/lib/site'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ExternalLink, Images, Package, Store, Tags } from 'lucide-react'
import { ButtonLink, EmptyState, Select, cn } from '@/components/ui/primitives'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import { ProductsManager } from '@/components/panel/ProductsManager'
import { CategoriesManager } from '@/components/panel/CategoriesManager'
import { PhotosManager } from '@/components/panel/PhotosManager'
import { listEstablishments, useLoader } from '@/lib/data'

const tabs = [
  { key: 'produtos', label: 'Produtos', icon: Package },
  { key: 'categorias', label: 'Categorias', icon: Tags },
  { key: 'fotografias', label: 'Fotografias', icon: Images },
] as const

export default function Menus() {
  const [params, setParams] = useSearchParams()
  const { data, loading, error, reload } = useLoader(listEstablishments, [])
  const selected = params.get('e') ?? ''
  const tab = (params.get('aba') as (typeof tabs)[number]['key']) || 'produtos'

  useEffect(() => {
    if (!selected && data?.length) setParams({ e: data[0]!.id, aba: tab }, { replace: true })
  }, [selected, data, setParams, tab])

  const current = data?.find((e) => e.id === selected)

  return (
    <>
      <PageHeader
        eyebrow="Conteúdo"
        title="Cardápios"
        description="Edite categorias, produtos e fotos de qualquer estabelecimento. A identidade visual de cada cardápio é desenvolvida em código."
        actions={
          current && (
            <a
              href={appPath(`/table/${current.slug}`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-[0.95rem] text-cream hover:bg-white/[0.09]"
            >
              <ExternalLink className="size-4 text-gold" aria-hidden /> Ver cardápio
            </a>
          )
        }
      />
      <ErrorBanner error={error} onRetry={() => reload()} />
      {loading && !data ? (
        <div className="skeleton h-12 w-72 rounded-xl" />
      ) : !data?.length ? (
        <EmptyState
          icon={<Store className="size-5" />}
          title="Nenhum estabelecimento"
          description="Cadastre um estabelecimento para montar o cardápio."
          action={<ButtonLink to="/admin/estabelecimentos?novo=1">Cadastrar estabelecimento</ButtonLink>}
        />
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-center gap-3">
              <span className="text-sm text-mist">Estabelecimento</span>
              <div className="w-[260px]">
              <Select
                value={selected}
                onChange={(e) => setParams({ e: e.target.value, aba: tab })}
              >
                {data.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {e.is_active ? '' : ' (inativo)'}
                  </option>
                ))}
              </Select>
              </div>
            </label>
            <div role="tablist" aria-label="Seções do cardápio" className="flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.key}
                  onClick={() => setParams({ e: selected, aba: t.key })}
                  className={cn('relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors', tab === t.key ? 'text-cream' : 'text-mist hover:text-cream')}
                >
                  {tab === t.key && (
                    <motion.span layoutId="menus-tab" className="absolute inset-0 rounded-full bg-white/[0.09]" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
                  )}
                  <t.icon className="relative size-4" aria-hidden />
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          {current && (
            <div role="tabpanel" key={`${current.id}-${tab}`}>
              {tab === 'produtos' && (
                <ProductsManager establishmentId={current.id} onGoToCategories={() => setParams({ e: current.id, aba: 'categorias' })} />
              )}
              {tab === 'categorias' && <CategoriesManager establishmentId={current.id} />}
              {tab === 'fotografias' && <PhotosManager establishmentId={current.id} />}
            </div>
          )}
        </>
      )}
    </>
  )
}

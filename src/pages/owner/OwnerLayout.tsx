import { useOutletContext } from 'react-router'
import { ExternalLink, House, Images, Package, Tags } from 'lucide-react'
import { PanelLayout } from '@/components/panel/PanelLayout'
import { useAuth } from '@/lib/auth'
import { getEstablishment, useLoader } from '@/lib/data'
import type { Establishment } from '@/lib/types'
import { FullScreenLoader } from '@/components/ui/FullScreenLoader'

export interface OwnerContext {
  establishment: Establishment
}

export function useOwner() {
  return useOutletContext<OwnerContext>()
}

export default function OwnerLayout() {
  const { profile } = useAuth()
  const estId = profile!.establishment_id!
  const { data: establishment, loading, error, reload } = useLoader(() => getEstablishment(estId), [estId])

  if (loading && !establishment) return <FullScreenLoader />
  if (!establishment) {
    return (
      <main className="grid min-h-dvh place-items-center bg-abyss px-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-semibold text-cream">Não foi possível abrir seu painel</h1>
          <p className="mt-3 text-mist">{error ? 'Verifique sua conexão e tente novamente.' : 'Estabelecimento não encontrado.'}</p>
          <button type="button" onClick={() => reload()} className="mt-6 rounded-full bg-gold px-5 py-2.5 font-medium text-navy-950">
            Tentar de novo
          </button>
        </div>
      </main>
    )
  }

  return (
    <PanelLayout
      home="/painel"
      subtitle={establishment.name}
      links={[
        { label: 'Início', href: '/painel', icon: <House />, end: true },
        { label: 'Produtos', href: '/painel/produtos', icon: <Package /> },
        { label: 'Categorias', href: '/painel/categorias', icon: <Tags /> },
        { label: 'Fotografias', href: '/painel/fotografias', icon: <Images /> },
        { label: 'Visualizar cardápio', href: `/table/${establishment.slug}`, icon: <ExternalLink />, external: true },
      ]}
      context={
        <div className="hidden rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 md:block" data-sidebar-context>
          <p className="truncate text-xs text-dim">Estabelecimento</p>
          <p className="truncate text-sm font-medium text-cream">{establishment.name}</p>
        </div>
      }
      outletContext={{ establishment } satisfies OwnerContext}
    />
  )
}

import { appPath } from '@/lib/site'
import { useNavigate } from 'react-router'
import { ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/panel/PanelLayout'
import { ProductsManager } from '@/components/panel/ProductsManager'
import { useOwner } from './OwnerLayout'

export default function OwnerProducts() {
  const { establishment } = useOwner()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader
        eyebrow={establishment.name}
        title="Produtos"
        description="Cadastre, edite e marque o que está disponível hoje. Tudo que você salva aparece no cardápio na hora."
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
      <ProductsManager establishmentId={establishment.id} onGoToCategories={() => navigate('/painel/categorias')} />
    </>
  )
}

import { PageHeader } from '@/components/panel/PanelLayout'
import { CategoriesManager } from '@/components/panel/CategoriesManager'
import { useOwner } from './OwnerLayout'

export default function OwnerCategories() {
  const { establishment } = useOwner()
  return (
    <>
      <PageHeader
        eyebrow={establishment.name}
        title="Categorias"
        description="As seções do seu cardápio. Crie, renomeie e escolha a ordem em que aparecem."
      />
      <CategoriesManager establishmentId={establishment.id} />
    </>
  )
}

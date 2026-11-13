import { PageHeader } from '@/components/panel/PanelLayout'
import { PhotosManager } from '@/components/panel/PhotosManager'
import { useOwner } from './OwnerLayout'

export default function OwnerPhotos() {
  const { establishment } = useOwner()
  return (
    <>
      <PageHeader
        eyebrow={establishment.name}
        title="Fotografias"
        description="Fotos bem iluminadas vendem mais. Envie, substitua ou remova a foto de cada produto."
      />
      <PhotosManager establishmentId={establishment.id} />
    </>
  )
}

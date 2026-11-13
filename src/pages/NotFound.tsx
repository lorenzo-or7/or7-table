import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/primitives'

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-abyss px-6 text-center">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,#151c4a,transparent)]" />
      <div className="relative">
        <Logo variant="stacked" className="mx-auto w-48" />
        <p className="display mt-10 text-[8rem] text-cream/10 sm:text-[12rem]">404</p>
        <h1 className="-mt-6 text-2xl font-semibold text-cream sm:-mt-10">Esta página não existe.</h1>
        <p className="mx-auto mt-3 max-w-sm text-mist">O endereço pode ter mudado ou foi digitado com algum erro.</p>
        <ButtonLink to="/" className="mt-8">
          Voltar ao início
        </ButtonLink>
      </div>
    </main>
  )
}

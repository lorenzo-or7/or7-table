import { Logo } from '@/components/brand/Logo'
import { Spinner } from './primitives'

export function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-abyss">
      <div className="flex flex-col items-center gap-5">
        <Logo variant="symbol" className="w-12 opacity-90" priority />
        <Spinner />
      </div>
    </div>
  )
}

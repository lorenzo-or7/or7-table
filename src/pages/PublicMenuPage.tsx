import { Suspense, useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { fetchPublicMenu, registerMenuView, type PublicMenu } from '@/lib/public-menu'
import { isSupabaseConfigured } from '@/lib/supabase'
import { demoMenu } from '@/data/demo-menu'
import { laBrasaMenu } from '@/data/demo-la-brasa'
import { starbucksMenu } from '@/data/demo-starbucks'

/** Demonstrações embutidas: usadas quando o Supabase não está configurado ou o slug não existe. */
const fallbacks: Record<string, PublicMenu> = { demo: demoMenu, 'la-brasa': laBrasaMenu, starbucks: starbucksMenu }
import { resolveTheme } from '@/menus/registry'

type State =
  | { status: 'loading' }
  | { status: 'ready'; menu: PublicMenu; isDemoData: boolean }
  | { status: 'missing' }
  | { status: 'error' }

export default function PublicMenuPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const source = params.get('src') === 'qr' ? 'qr' : 'link'
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState({ status: 'loading' })
      const normalized = slug.toLowerCase()
      try {
        const menu = await fetchPublicMenu(normalized)
        if (menu) {
          if (menu.establishment.external_url) {
            await registerMenuView(normalized, source).catch(() => {})
            window.location.replace(menu.establishment.external_url)
            return
          }
          setState({ status: 'ready', menu, isDemoData: false })
          return
        }
        if (fallbacks[normalized]) {
          setState({ status: 'ready', menu: fallbacks[normalized]!, isDemoData: true })
          return
        }
        if (!silent) setState({ status: 'missing' })
      } catch {
        // Com Supabase configurado, uma falha de rede NÃO troca o cardápio real pelo demonstrativo:
        // mostra o erro com "Tentar novamente". Sem Supabase (só demonstração), usa os dados locais.
        if (!isSupabaseConfigured && fallbacks[normalized]) setState({ status: 'ready', menu: fallbacks[normalized]!, isDemoData: true })
        else if (!silent) setState({ status: 'error' })
      }
    },
    [slug, source],
  )

  useEffect(() => {
    load()
  }, [load])

  // visita registrada uma vez por sessão (sem cookies, sem dados pessoais)
  useEffect(() => {
    if (state.status === 'ready' && !state.isDemoData) {
      registerMenuView(slug.toLowerCase(), source).catch(() => {})
    }
  }, [state.status, slug, source, state])

  // cliente voltou para a aba: busca preços e disponibilidade atualizados
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const onVisible = () => document.visibilityState === 'visible' && load(true)
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  useEffect(() => {
    if (state.status === 'ready') document.title = `${state.menu.establishment.name} · Cardápio`
    return () => {
      document.title = 'Or7 Table — Cardápios digitais exclusivos por QR Code'
    }
  }, [state])

  if (state.status === 'loading') return <MenuSkeleton />
  if (state.status === 'missing' || state.status === 'error') {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F7F5F0] px-6 text-center text-zinc-900" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div className="max-w-sm">
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">{state.status === 'error' ? 'Sem conexão' : 'Cardápio indisponível'}</p>
          <h1 className="mt-3 text-2xl font-semibold">
            {state.status === 'error' ? 'Não conseguimos carregar o cardápio.' : 'Este cardápio não está disponível agora.'}
          </h1>
          <p className="mt-3 text-zinc-600">
            {state.status === 'error'
              ? 'Verifique sua internet e tente de novo.'
              : 'Confira o endereço ou peça ajuda à equipe do estabelecimento.'}
          </p>
          {state.status === 'error' ? (
            <button type="button" onClick={() => load()} className="mt-6 rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white">
              Tentar novamente
            </button>
          ) : (
            <Link to="/" className="mt-6 inline-block text-sm font-medium underline underline-offset-4">
              Conhecer o Or7 Table
            </Link>
          )}
        </div>
      </main>
    )
  }

  const Theme = resolveTheme(state.menu.establishment.theme_key).component
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <Theme menu={state.menu} isDemoData={state.isDemoData} />
    </Suspense>
  )
}

function MenuSkeleton() {
  return (
    <div className="min-h-dvh bg-[#F2EEE6]" role="status" aria-label="Carregando cardápio">
      <div className="h-[300px] animate-pulse bg-[#E4DDD0]" />
      <div className="mx-auto max-w-xl space-y-5 px-5 py-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#E4DDD0]" />
              <div className="h-3 w-full animate-pulse rounded bg-[#ECE6DB]" />
            </div>
            <div className="size-20 animate-pulse rounded-2xl bg-[#E4DDD0]" />
          </div>
        ))}
      </div>
    </div>
  )
}

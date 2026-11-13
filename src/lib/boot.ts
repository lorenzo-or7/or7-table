/**
 * Progresso real da inicialização do painel Or7 Table (login, /admin, /painel).
 * Cada etapa é marcada por quem de fato a conclui — nada avança por timer:
 *   shell   → o app React montou (o bundle principal carregou e executou)
 *   session → o Supabase respondeu se há sessão salva
 *   profile → o perfil/papel foi lido do banco (só existe quando há sessão)
 *   route   → o código da tela pedida carregou e ela foi exibida
 * As páginas públicas dos restaurantes e a landing não usam este fluxo.
 */
import { useSyncExternalStore } from 'react'

export type BootStep = 'shell' | 'session' | 'profile' | 'route'

export const BOOT_LABELS: Record<BootStep, string> = {
  shell: 'Iniciando o painel',
  session: 'Verificando sua sessão',
  profile: 'Confirmando permissões',
  route: 'Abrindo a tela',
}

type Snapshot = { needed: BootStep[]; done: BootStep[]; error: string | null; finished: boolean }

// 'profile' fica sempre na lista: sem sessão, não há perfil a confirmar e a etapa é concluída na hora
let state: Snapshot = { needed: ['shell', 'session', 'profile', 'route'], done: [], error: null, finished: false }
const listeners = new Set<() => void>()

function emit(next: Partial<Snapshot>) {
  state = { ...state, ...next }
  state.finished = !state.error && state.needed.every((s) => state.done.includes(s))
  listeners.forEach((l) => l())
}

export function bootMark(step: BootStep) {
  if (state.done.includes(step)) return
  emit({ done: [...state.done, step] })
}

/** Declara uma etapa extra (ex.: há sessão, então o perfil também precisa carregar). */
export function bootNeed(step: BootStep) {
  if (state.needed.includes(step) || state.finished) return
  emit({ needed: [...state.needed, step] })
}

export function bootFail(message: string) {
  if (state.finished) return
  emit({ error: message })
}

export function useBoot() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}

/** Rotas que formam o "shell" do produto e recebem a tela de carregamento. */
export const isShellPath = (path: string) => /^\/(entrar|login|verificacao|admin|painel|redefinir-senha)(\/|$)/.test(path)

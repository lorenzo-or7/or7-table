import { assetUrl, appPath } from '@/lib/site'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { bootFail } from '@/lib/boot'

/**
 * Última barreira: se uma tela quebrar ou o código dela não carregar (ex.: versão antiga em cache
 * depois de uma publicação), mostra uma saída clara em vez de uma página em branco.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; chunk: boolean }> {
  state = { failed: false, chunk: false }

  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return { failed: true, chunk: /dynamically imported module|Loading chunk|Failed to fetch|Importing a module script failed/i.test(msg) }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    bootFail(this.state.chunk ? 'Uma nova versão foi publicada ou a conexão caiu. Recarregue a página.' : 'Ocorreu um erro inesperado ao abrir a tela.')
    // só a mensagem técnica (sem dados do usuário), para diagnóstico no console
    console.error('[Or7 Table]', error instanceof Error ? error.message : error, info.componentStack?.split('\n')[1]?.trim())
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="grid min-h-dvh place-items-center bg-[#0F1432] px-6 text-center">
        <div className="max-w-sm">
          <img src={assetUrl('/brand/or7table-symbol.webp')} width={256} height={179} alt="Or7 Table" className="mx-auto h-auto w-14" />
          <h1 className="mt-8 text-2xl font-semibold text-cream">{this.state.chunk ? 'Atualize a página' : 'Algo saiu do lugar'}</h1>
          <p className="mt-3 leading-relaxed text-mist">
            {this.state.chunk
              ? 'Uma nova versão foi publicada ou a conexão oscilou enquanto a tela carregava.'
              : 'Esta tela encontrou um erro inesperado. Seus dados não foram alterados.'}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 outline-none focus-visible:ring-2 focus-visible:ring-gold-soft">
              Recarregar
            </button>
            <a href={appPath('/')} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-cream outline-none focus-visible:ring-2 focus-visible:ring-gold">
              Ir para o site
            </a>
          </div>
        </div>
      </main>
    )
  }
}

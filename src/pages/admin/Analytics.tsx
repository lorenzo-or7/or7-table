import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ChartNoAxesColumn } from 'lucide-react'
import { EmptyState, cn } from '@/components/ui/primitives'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import { SERIES, SourceSplit, ViewsChart, fillDays } from '@/components/panel/charts'
import { listEstablishments, useLoader, viewStats } from '@/lib/data'

const periods = [7, 30, 90] as const

export default function Analytics() {
  const [days, setDays] = useState<(typeof periods)[number]>(30)
  const [filter, setFilter] = useState('all')
  const { data, loading, error, reload } = useLoader(async () => {
    const [establishments, stats] = await Promise.all([listEstablishments(), viewStats(days)])
    return { establishments, stats }
  }, [days])

  const view = useMemo(() => {
    if (!data) return null
    const rows = filter === 'all' ? data.stats : data.stats.filter((s) => s.establishment_id === filter)
    const total = rows.reduce((a, r) => a + r.views, 0)
    const qr = rows.filter((r) => r.source === 'qr').reduce((a, r) => a + r.views, 0)
    const series = fillDays(rows, days)
    const ranking = data.establishments
      .map((e) => {
        const r = data.stats.filter((s) => s.establishment_id === e.id)
        return { e, total: r.reduce((a, x) => a + x.views, 0), qr: r.filter((x) => x.source === 'qr').reduce((a, x) => a + x.views, 0) }
      })
      .sort((a, b) => b.total - a.total)
    const best = series.reduce((m, d) => (d.qr + d.link > m.qr + m.link ? d : m), series[0]!)
    return { total, qr, link: total - qr, series, ranking, avg: total / days, best }
  }, [data, filter, days])

  const maxRank = Math.max(1, ...(view?.ranking.map((r) => r.total) ?? [0]))

  return (
    <>
      <PageHeader eyebrow="Dados" title="Analytics" description="Visualizações dos cardápios públicos. Contagem anônima, sem cookies e sem dados pessoais." />
      <ErrorBanner error={error} onRetry={() => reload()} />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1" role="group" aria-label="Período">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={days === p}
              onClick={() => setDays(p)}
              className={cn('rounded-full px-4 py-1.5 text-sm transition-colors', days === p ? 'bg-white/[0.09] text-cream' : 'text-mist hover:text-cream')}
            >
              {p} dias
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-mist">
          <span>Estabelecimento</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-full border border-white/10 bg-navy-950 px-4 text-cream outline-none focus:border-gold/60"
          >
            <option value="all">Todos</option>
            {data?.establishments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && !view ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-[340px] rounded-2xl" />
        </div>
      ) : view ? (
        <div className={cn('grid gap-4 transition-opacity', loading && 'opacity-60')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: `Visualizações · ${days} dias`, value: view.total.toLocaleString('pt-BR') },
              { label: 'Média por dia', value: view.avg.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) },
              {
                label: 'Dia com mais acessos',
                value: view.total ? new Date(view.best.day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : '—',
              },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5">
                <p className="text-sm text-mist">{k.label}</p>
                <p className="mt-3 text-[1.9rem] leading-none font-semibold text-cream tabular">{k.value}</p>
              </div>
            ))}
          </div>

          {view.total === 0 ? (
            <EmptyState
              icon={<ChartNoAxesColumn className="size-5" />}
              title="Sem visitas no período"
              description="Assim que clientes abrirem os cardápios pelo QR Code ou link, os números aparecem aqui."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <section className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6" aria-labelledby="an-chart">
                <h2 id="an-chart" className="mb-6 font-semibold text-cream">
                  Visualizações por dia
                </h2>
                <ViewsChart data={view.series} height={240} />
              </section>
              <section className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6" aria-labelledby="an-source">
                <h2 id="an-source" className="mb-6 font-semibold text-cream">
                  Origem dos acessos
                </h2>
                <SourceSplit qr={view.qr} link={view.link} />
              </section>
            </div>
          )}

          <section className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6" aria-labelledby="an-rank">
            <h2 id="an-rank" className="mb-5 font-semibold text-cream">
              Por estabelecimento
            </h2>
            {view.ranking.length === 0 ? (
              <p className="text-sm text-dim">Nenhum estabelecimento cadastrado.</p>
            ) : (
              <ol className="grid grid-cols-1 gap-3.5">
                {view.ranking.map(({ e, total, qr }, i) => (
                  <li key={e.id} className="grid grid-cols-[1.5rem_minmax(0,10rem)_minmax(0,1fr)_4rem] items-center gap-3 text-sm sm:grid-cols-[1.5rem_minmax(0,14rem)_minmax(0,1fr)_5rem]">
                    <span className="text-dim tabular">{i + 1}</span>
                    <span className="truncate text-cream">{e.name}</span>
                    <span className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-white/[0.04]" aria-hidden>
                      <motion.span className="h-full rounded-l-full" style={{ background: SERIES.qr }} initial={{ width: 0 }} animate={{ width: `${(qr / maxRank) * 100}%` }} transition={{ duration: 0.7 }} />
                      <motion.span
                        className="h-full rounded-r-full"
                        style={{ background: SERIES.link }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((total - qr) / maxRank) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.05 }}
                      />
                    </span>
                    <span className="text-right text-cream tabular">
                      {total.toLocaleString('pt-BR')}
                      <span className="sr-only"> visualizações, {qr} por QR Code</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}
    </>
  )
}

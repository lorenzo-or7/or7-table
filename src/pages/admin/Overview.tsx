import { useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowUpRight, Eye, Plus, Store, UtensilsCrossed, Wallet } from 'lucide-react'
import { ButtonLink, EmptyState, Badge, cn } from '@/components/ui/primitives'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import { SourceSplit, Sparkline, ViewsChart, fillDays } from '@/components/panel/charts'
import { listBilling, listEstablishments, listProfiles, useLoader, viewStats } from '@/lib/data'
import { formatBRL } from '@/lib/format'
import { useAuth } from '@/lib/auth'

export function useAdminSnapshot(days = 30) {
  return useLoader(async () => {
    const [establishments, billing, profiles, stats] = await Promise.all([
      listEstablishments(),
      listBilling(),
      listProfiles(),
      viewStats(days),
    ])
    return { establishments, billing, profiles, stats }
  }, [days])
}

export function Kpi({
  icon,
  label,
  value,
  hint,
  children,
  delay = 0,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  children?: React.ReactNode
  delay?: number
  accent?: boolean
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border p-5',
        accent ? 'hairline-top border-gold/20 bg-[linear-gradient(160deg,#18205a,#0d1232)]' : 'border-white/[0.07] bg-navy-950/50',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-mist">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gold [&>svg]:size-4">{icon}</span>
      </div>
      <p className="mt-4 text-[2rem] leading-none font-semibold tracking-tight text-cream tabular">{value}</p>
      {hint && <p className="mt-2 text-xs text-dim">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </motion.article>
  )
}

export default function Overview() {
  const { profile } = useAuth()
  const { data, loading, error, reload } = useAdminSnapshot(30)

  const view = useMemo(() => {
    if (!data) return null
    const { establishments, billing, profiles, stats } = data
    const active = establishments.filter((e) => e.is_active)
    const feeOf = Object.fromEntries(billing.map((b) => [b.establishment_id, Number(b.monthly_fee)]))
    const revenue = active.reduce((sum, e) => sum + (feeOf[e.id] ?? 0), 0)
    const days = fillDays(stats, 30)
    const totalViews = stats.reduce((a, s) => a + s.views, 0)
    const qr = stats.filter((s) => s.source === 'qr').reduce((a, s) => a + s.views, 0)
    const viewsBy = stats.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.establishment_id]: (acc[s.establishment_id] ?? 0) + s.views }), {})
    const ownerOf = profiles.reduce<Record<string, string>>((acc, p) => {
      if (p.role === 'owner' && p.establishment_id) acc[p.establishment_id] = p.full_name || p.email
      return acc
    }, {})
    return { establishments, active, revenue, days, totalViews, qr, link: totalViews - qr, viewsBy, ownerOf, feeOf }
  }, [data])

  const firstName = profile?.full_name?.split(' ')[0]
  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <>
      <PageHeader
        eyebrow={today}
        title={firstName ? `Olá, ${firstName}.` : 'Visão geral'}
        accent={firstName ? 'Esta é a visão geral.' : 'do Or7 Table'}
        actions={
          <ButtonLink to="/admin/estabelecimentos?novo=1" icon={<Plus className="size-4" />}>
            Novo estabelecimento
          </ButtonLink>
        }
      />
      <ErrorBanner error={error} onRetry={() => reload()} />

      {loading && !view ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[148px] rounded-2xl" />
          ))}
          <div className="skeleton h-[340px] rounded-2xl sm:col-span-2 xl:col-span-3" />
          <div className="skeleton h-[340px] rounded-2xl" />
        </div>
      ) : view ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={<Store />} label="Estabelecimentos" value={String(view.establishments.length)} hint={`${view.establishments.length - view.active.length} inativos`} />
            <Kpi icon={<UtensilsCrossed />} label="Cardápios ativos" value={String(view.active.length)} hint="Publicados e acessíveis" delay={0.05} />
            <Kpi icon={<Eye />} label="Visualizações · 30 dias" value={view.totalViews.toLocaleString('pt-BR')} delay={0.1}>
              <Sparkline values={view.days.map((d) => d.qr + d.link)} />
            </Kpi>
            <Kpi icon={<Wallet />} label="Receita mensal cadastrada" value={formatBRL(view.revenue)} hint="Soma das mensalidades ativas" delay={0.15} accent />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6" aria-labelledby="ov-views">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 id="ov-views" className="font-semibold text-cream">
                    Visualizações dos cardápios
                  </h2>
                  <p className="text-sm text-dim">Últimos 30 dias, todos os estabelecimentos</p>
                </div>
                <Link to="/admin/analytics" className="inline-flex items-center gap-1 text-sm text-gold-soft hover:underline">
                  Analytics <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              {view.totalViews === 0 ? (
                <EmptyState
                  className="py-10"
                  icon={<Eye className="size-5" />}
                  title="Ainda sem visitas registradas"
                  description="Cada abertura de cardápio público (por QR Code ou link) aparece aqui, sem dados pessoais."
                />
              ) : (
                <ViewsChart data={view.days} />
              )}
            </section>
            <section className="flex flex-col rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6" aria-labelledby="ov-source">
              <h2 id="ov-source" className="font-semibold text-cream">
                Origem dos acessos
              </h2>
              <p className="mb-6 text-sm text-dim">QR Code impresso × link compartilhado</p>
              <SourceSplit qr={view.qr} link={view.link} />
              <p className="mt-auto pt-6 text-xs leading-relaxed text-dim">
                Contagem anônima: uma visita por sessão do navegador, sem cookies e sem dados pessoais.
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-white/[0.07] bg-navy-950/50" aria-labelledby="ov-list">
            <div className="flex items-center justify-between gap-3 p-5 sm:px-6">
              <h2 id="ov-list" className="font-semibold text-cream">
                Estabelecimentos
              </h2>
              <Link to="/admin/estabelecimentos" className="inline-flex items-center gap-1 text-sm text-gold-soft hover:underline">
                Gerenciar <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            {view.establishments.length === 0 ? (
              <EmptyState
                className="mx-5 mb-5 sm:mx-6"
                icon={<Store className="size-5" />}
                title="Nenhum estabelecimento cadastrado"
                description="Cadastre o primeiro cliente para gerar o cardápio, o acesso do proprietário e o QR Code."
                action={<ButtonLink to="/admin/estabelecimentos?novo=1">Cadastrar estabelecimento</ButtonLink>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-y border-white/[0.06] text-xs text-dim">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-medium">Estabelecimento</th>
                      <th scope="col" className="px-3 py-3 font-medium">Status</th>
                      <th scope="col" className="px-3 py-3 font-medium">Proprietário</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Mensalidade</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Visitas 30d</th>
                      <th scope="col" className="px-6 py-3"><span className="sr-only">Abrir</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {view.establishments.slice(0, 8).map((e) => (
                      <tr key={e.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-cream">{e.name}</p>
                          <p className="text-xs text-dim">/table/{e.slug}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge tone={e.is_active ? 'mint' : 'neutral'}>
                            <i className={cn('size-1.5 rounded-full', e.is_active ? 'bg-mint' : 'bg-dim')} aria-hidden />
                            {e.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5 text-mist">{view.ownerOf[e.id] ?? <span className="text-dim">Sem acesso</span>}</td>
                        <td className="px-3 py-3.5 text-right text-cream tabular">{formatBRL(view.feeOf[e.id] ?? 0)}</td>
                        <td className="px-3 py-3.5 text-right text-cream tabular">{(view.viewsBy[e.id] ?? 0).toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-3.5 text-right">
                          <a
                            href={`/table/${e.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Abrir cardápio de ${e.name}`}
                            className="inline-grid size-8 place-items-center rounded-full text-mist hover:bg-white/[0.06] hover:text-cream"
                          >
                            <ArrowUpRight className="size-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  )
}

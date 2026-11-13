/**
 * Financeiro manual do Or7 Table (Super Admin).
 * "Contratado" vem das mensalidades cadastradas em cada estabelecimento; "recebido" só existe quando a
 * Or7 lança o pagamento aqui. Os dois números nunca se misturam. Nenhum pagamento é processado.
 */
import { useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CalendarCheck, HandCoins, Plus, Search, Trash2, Wallet } from 'lucide-react'
import { Badge, Button, EmptyState, Field, IconButton, Input, Select, Textarea } from '@/components/ui/primitives'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlays'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import { createPayment, deletePayment, listBilling, listEstablishments, listPayments, useLoader, type PaymentInput } from '@/lib/data'
import { formatBRL, formatDate, parseBRL, priceToInput } from '@/lib/format'
import { friendlyError } from '@/lib/supabase'
import type { Billing, Establishment, Payment, PaymentMethod } from '@/lib/types'
import { Kpi } from './Overview'

const METHODS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
}

const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number)
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(y!, m! - 1, 1))
  return s.charAt(0).toUpperCase() + s.slice(1)
}
/** Data sem horário (AAAA-MM-DD) exibida no dia certo, sem deslocamento de fuso. */
const formatDay = (iso: string) => formatDate(`${iso.slice(0, 10)}T12:00:00`)
const todayISO = () => new Date().toLocaleDateString('sv-SE')

type Status = 'paid' | 'partial' | 'late' | 'open' | 'none'

export default function Finance() {
  const toast = useToast()
  const { data, setData, loading, error, reload } = useLoader(async () => {
    const [establishments, billing, payments] = await Promise.all([listEstablishments(), listBilling(), listPayments()])
    return { establishments, billing, payments }
  }, [])
  const [month, setMonth] = useState(monthKey())
  const [filterEst, setFilterEst] = useState('')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<{ establishment_id: string } | null>(null)
  const [toDelete, setToDelete] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const view = useMemo(() => {
    if (!data) return null
    const billingOf: Record<string, Billing> = Object.fromEntries(data.billing.map((b) => [b.establishment_id, { ...b, monthly_fee: Number(b.monthly_fee) }]))
    const active = data.establishments.filter((e) => e.is_active)
    const ref = `${month}-01`
    const isCurrent = month === monthKey()
    const isPast = month < monthKey()
    const today = new Date().getDate()

    const rows = data.establishments.map((e) => {
      const fee = billingOf[e.id]?.monthly_fee ?? 0
      const due = billingOf[e.id]?.due_day ?? null
      const paid = data.payments.filter((p) => p.establishment_id === e.id && p.reference_month === ref).reduce((s, p) => s + p.amount, 0)
      let status: Status = 'none'
      if (fee > 0 && e.is_active) {
        if (paid >= fee) status = 'paid'
        else if (paid > 0) status = 'partial'
        else if (isPast || (isCurrent && due !== null && today > due)) status = 'late'
        else status = 'open'
      }
      return { e, fee, due, paid, status }
    })

    const contracted = active.reduce((s, e) => s + (billingOf[e.id]?.monthly_fee ?? 0), 0)
    const received = data.payments.filter((p) => p.reference_month === ref).reduce((s, p) => s + p.amount, 0)
    const late = rows.filter((r) => r.status === 'late' || r.status === 'partial')
    return { billingOf, rows, contracted, received, late, active }
  }, [data, month])

  const history = useMemo(() => {
    if (!data) return []
    const name = Object.fromEntries(data.establishments.map((e) => [e.id, e.name]))
    const q = query.trim().toLowerCase()
    return data.payments
      .filter((p) => !filterEst || p.establishment_id === filterEst)
      .filter((p) => !q || (name[p.establishment_id] ?? '').toLowerCase().includes(q) || (p.notes ?? '').toLowerCase().includes(q))
      .map((p) => ({ ...p, name: name[p.establishment_id] ?? 'Estabelecimento removido' }))
  }, [data, filterEst, query])

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deletePayment(toDelete.id)
      setData((d) => d && { ...d, payments: d.payments.filter((p) => p.id !== toDelete.id) })
      toast.success('Lançamento excluído.')
      setToDelete(null)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Mensalidades"
        description="Valor contratado de um lado, pagamento confirmado do outro. Os recebimentos são lançados manualmente pela Or7: nada é cobrado ou processado por aqui."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setModal({ establishment_id: '' })} disabled={!data?.establishments.length}>
            Registrar pagamento
          </Button>
        }
      />
      <ErrorBanner error={error} onRetry={() => reload()} />

      {loading && !view ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[148px] rounded-2xl" />
          ))}
          <div className="skeleton h-[320px] rounded-2xl sm:col-span-2 xl:col-span-4" />
        </div>
      ) : view && data ? (
        <div className="grid grid-cols-1 gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="w-full max-w-[220px]">
              <Field label="Mês de competência">
                {(id) => <Input id={id} type="month" value={month} max={monthKey(new Date(new Date().getFullYear() + 1, 11, 1))} onChange={(e) => e.target.value && setMonth(e.target.value)} className="tabular" />}
              </Field>
            </div>
            <p className="text-sm text-dim">{monthLabel(month)}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={<Wallet />} label="Receita recorrente contratada" value={formatBRL(view.contracted)} hint={`${view.active.length} estabelecimentos ativos`} accent />
            <Kpi icon={<HandCoins />} label="Recebido no mês" value={formatBRL(view.received)} hint="Somente pagamentos lançados" delay={0.05} />
            <Kpi icon={<CalendarCheck />} label="Ainda a receber" value={formatBRL(Math.max(0, view.rows.reduce((s, r) => s + (r.status === 'none' ? 0 : Math.max(0, r.fee - r.paid)), 0)))} hint="Contratado menos recebido" delay={0.1} />
            <Kpi icon={<AlertTriangle />} label="Em atraso" value={String(view.late.length)} hint={view.late.length ? view.late.map((r) => r.e.name).slice(0, 2).join(', ') : 'Nenhum no período'} delay={0.15} />
          </div>

          <section aria-labelledby="fin-month" className="overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/50">
            <h2 id="fin-month" className="border-b border-white/[0.06] px-5 py-4 font-semibold text-cream">
              Situação em {monthLabel(month)}
            </h2>
            {data.establishments.length === 0 ? (
              <EmptyState className="m-5" title="Nenhum estabelecimento cadastrado" description="Cadastre um estabelecimento e defina a mensalidade para acompanhar os recebimentos." />
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                <li aria-hidden className="hidden grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] gap-3 px-5 py-2.5 text-xs text-dim sm:grid">
                  <span>Estabelecimento</span>
                  <span>Contratado</span>
                  <span>Recebido</span>
                  <span>Situação</span>
                  <span className="w-[86px]" />
                </li>
                {view.rows.map((r) => (
                  <li key={r.e.id} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-cream">{r.e.name}</p>
                      <p className="text-xs text-dim">{r.e.is_active ? (r.due ? `Vence todo dia ${r.due}` : 'Sem dia de vencimento') : 'Inativo'}</p>
                    </div>
                    <p className="text-sm text-mist">
                      <span className="block text-xs text-dim sm:hidden">Contratado</span>
                      <span className="tabular text-cream">{formatBRL(r.fee)}</span>
                    </p>
                    <p className="text-sm text-mist">
                      <span className="block text-xs text-dim sm:hidden">Recebido</span>
                      <span className="tabular text-cream">{formatBRL(r.paid)}</span>
                    </p>
                    <div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="sm:justify-self-end">
                      {r.status !== 'none' && r.status !== 'paid' && (
                        <Button size="sm" variant="secondary" onClick={() => setModal({ establishment_id: r.e.id })}>
                          Registrar
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="fin-history">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <h2 id="fin-history" className="font-semibold text-cream">
                Histórico de recebimentos <span className="text-sm font-normal text-dim">{history.length}</span>
              </h2>
              <div className="flex w-full flex-wrap gap-3 sm:w-auto">
                <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                  <span className="sr-only">Buscar no histórico</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-dim" aria-hidden />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar" className="h-10 pl-10 text-sm" />
                </label>
                <label className="w-full sm:w-56">
                  <span className="sr-only">Filtrar por estabelecimento</span>
                  <Select value={filterEst} onChange={(e) => setFilterEst(e.target.value)} className="h-10 text-sm">
                    <option value="">Todos os estabelecimentos</option>
                    {data.establishments.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </div>
            {history.length === 0 ? (
              <EmptyState
                icon={<HandCoins className="size-5" />}
                title={data.payments.length ? 'Nenhum lançamento com esses filtros' : 'Nenhum pagamento lançado ainda'}
                description={data.payments.length ? 'Limpe a busca ou escolha outro estabelecimento.' : 'Quando um cliente pagar a mensalidade, registre aqui para acompanhar a receita real.'}
              />
            ) : (
              <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/50">
                {history.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-cream">{p.name}</p>
                      <p className="text-xs text-dim">
                        {monthLabel(p.reference_month.slice(0, 7))} · pago em {formatDay(p.paid_at)}
                        {p.method ? ` · ${METHODS[p.method]}` : ''}
                        {p.notes ? ` · ${p.notes}` : ''}
                      </p>
                    </div>
                    <p className="tabular font-semibold text-cream">{formatBRL(p.amount)}</p>
                    <IconButton label={`Excluir lançamento de ${p.name}`} tone="danger" onClick={() => setToDelete(p)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {data && (
        <PaymentModal
          key={modal ? `${modal.establishment_id}-${month}` : 'closed'}
          open={modal !== null}
          establishments={data.establishments}
          billingOf={view?.billingOf ?? {}}
          defaults={{ establishment_id: modal?.establishment_id ?? '', month }}
          onClose={() => setModal(null)}
          onSaved={(p) => {
            setData((d) => d && { ...d, payments: [p, ...d.payments] })
            setModal(null)
          }}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Excluir este lançamento?"
        description={toDelete ? `${formatBRL(toDelete.amount)} de ${monthLabel(toDelete.reference_month.slice(0, 7))}. A receita recebida do mês será recalculada.` : undefined}
        confirmLabel="Excluir lançamento"
      />
    </>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'paid') return <Badge tone="mint">Pago</Badge>
  if (status === 'partial') return <Badge tone="gold">Pago em parte</Badge>
  if (status === 'late') return <Badge tone="red">Em atraso</Badge>
  if (status === 'open') return <Badge>A vencer</Badge>
  return <span className="text-xs text-dim">Sem mensalidade</span>
}

function PaymentModal({
  open,
  establishments,
  billingOf,
  defaults,
  onClose,
  onSaved,
}: {
  open: boolean
  establishments: Establishment[]
  billingOf: Record<string, Billing>
  defaults: { establishment_id: string; month: string }
  onClose: () => void
  onSaved: (p: Payment) => void
}) {
  const toast = useToast()
  const [est, setEst] = useState(defaults.establishment_id)
  const [month, setMonth] = useState(defaults.month)
  const [amount, setAmount] = useState(defaults.establishment_id ? priceToInput(billingOf[defaults.establishment_id]?.monthly_fee ?? 0) : '')
  const [paidAt, setPaidAt] = useState(todayISO())
  const [method, setMethod] = useState<PaymentMethod | ''>('pix')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = parseBRL(amount)
    const errs: Record<string, string> = {}
    if (!est) errs.est = 'Escolha o estabelecimento.'
    if (!/^\d{4}-\d{2}$/.test(month)) errs.month = 'Informe o mês de competência.'
    if (value === null || value <= 0) errs.amount = 'Informe um valor maior que zero.'
    if (!paidAt) errs.paidAt = 'Informe a data do pagamento.'
    else if (paidAt > todayISO()) errs.paidAt = 'A data do pagamento não pode estar no futuro.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const input: PaymentInput = { establishment_id: est, reference_month: `${month}-01`, amount: value!, paid_at: paidAt, method: method || null, notes: notes.trim() || null }
      const saved = await createPayment(input)
      toast.success('Pagamento registrado.')
      onSaved({ ...saved, amount: Number(saved.amount), reference_month: String(saved.reference_month).slice(0, 10), paid_at: String(saved.paid_at).slice(0, 10) })
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pagamento recebido"
      description="Lance somente valores que já caíram na conta. O lançamento entra na receita recebida do mês de competência."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="payment-form" loading={busy}>
            Registrar
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Estabelecimento" error={errors.est} className="sm:col-span-2">
          {(id, d) => (
            <Select
              id={id}
              aria-describedby={d}
              aria-invalid={Boolean(errors.est)}
              value={est}
              data-autofocus
              onChange={(e) => {
                setEst(e.target.value)
                const fee = billingOf[e.target.value]?.monthly_fee
                if (fee) setAmount(priceToInput(fee))
              }}
            >
              <option value="">Escolha…</option>
              {establishments.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Competência" error={errors.month}>
          {(id, d) => <Input id={id} aria-describedby={d} type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="tabular" />}
        </Field>
        <Field label="Valor recebido" error={errors.amount}>
          {(id, d) => (
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-dim">R$</span>
              <Input
                id={id}
                aria-describedby={d}
                aria-invalid={Boolean(errors.amount)}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d,.]/g, ''))}
                onBlur={() => {
                  const v = parseBRL(amount)
                  if (v !== null) setAmount(priceToInput(v))
                }}
                className="pl-10 tabular"
              />
            </div>
          )}
        </Field>
        <Field label="Data do pagamento" error={errors.paidAt}>
          {(id, d) => <Input id={id} aria-describedby={d} type="date" max={todayISO()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="tabular" />}
        </Field>
        <Field label="Forma de pagamento" optional>
          {(id) => (
            <Select id={id} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | '')}>
              <option value="">Não informar</option>
              {Object.entries(METHODS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Observações" optional className="sm:col-span-2">
          {(id) => <Textarea id={id} value={notes} maxLength={300} rows={2} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
      </form>
    </Modal>
  )
}

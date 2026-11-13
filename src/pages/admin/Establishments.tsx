import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowUpRight, Ellipsis, Pencil, Plus, QrCode, Search, Store, Trash2, UserPlus, UtensilsCrossed } from 'lucide-react'
import { Badge, Button, EmptyState, Field, IconButton, Input, Select, Switch, Textarea, cn } from '@/components/ui/primitives'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlays'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import { ImageField } from '@/components/panel/ImageField'
import {
  deleteEstablishment,
  listBilling,
  listEstablishments,
  listProfiles,
  removeMedia,
  saveBilling,
  saveEstablishment,
  uploadMedia,
  useLoader,
} from '@/lib/data'
import { formatBRL, parseBRL, priceToInput, slugify, SLUG_PATTERN } from '@/lib/format'
import { friendlyError, mediaUrl } from '@/lib/supabase'
import { publicMenuUrl } from '@/lib/site'
import type { Billing, Establishment } from '@/lib/types'
import { menuThemes } from '@/menus/registry'

export default function Establishments() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { data, setData, loading, error, reload } = useLoader(async () => {
    const [establishments, billing, profiles] = await Promise.all([listEstablishments(), listBilling(), listProfiles()])
    return { establishments, billing, profiles }
  }, [])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<Establishment | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Establishment | null>(null)
  const [busyDelete, setBusyDelete] = useState(false)

  useEffect(() => {
    if (params.get('novo') === '1') {
      setEditing('new')
      params.delete('novo')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const billingOf = useMemo(() => Object.fromEntries((data?.billing ?? []).map((b) => [b.establishment_id, b])), [data])
  const ownersOf = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const p of data?.profiles ?? []) if (p.role === 'owner' && p.establishment_id) (map[p.establishment_id] ??= []).push(p.full_name || p.email)
    return map
  }, [data])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.establishments ?? []).filter(
      (e) =>
        (status === 'all' || (status === 'active' ? e.is_active : !e.is_active)) &&
        (!q || e.name.toLowerCase().includes(q) || e.slug.includes(q)),
    )
  }, [data, query, status])

  const toggleActive = async (e: Establishment, next: boolean) => {
    setData((d) => d && { ...d, establishments: d.establishments.map((x) => (x.id === e.id ? { ...x, is_active: next } : x)) })
    try {
      const { id, created_at, updated_at, ...rest } = e
      void created_at
      void updated_at
      await saveEstablishment({ ...rest, is_active: next }, id)
      toast.success(next ? `${e.name} ativado. O cardápio está no ar.` : `${e.name} desativado. O cardápio saiu do ar.`)
    } catch (err) {
      setData((d) => d && { ...d, establishments: d.establishments.map((x) => (x.id === e.id ? { ...x, is_active: !next } : x)) })
      toast.error(friendlyError(err))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusyDelete(true)
    try {
      await deleteEstablishment(deleting.id)
      await removeMedia([deleting.logo_path]).catch(() => {})
      setData((d) => d && { ...d, establishments: d.establishments.filter((x) => x.id !== deleting.id) })
      toast.success('Estabelecimento excluído.')
      setDeleting(null)
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusyDelete(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        title="Estabelecimentos"
        description="Cada estabelecimento tem um endereço permanente, uma identidade de cardápio e um proprietário."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
            Novo estabelecimento
          </Button>
        }
      />
      <ErrorBanner error={error} onRetry={() => reload()} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar estabelecimento</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-dim" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou endereço" className="pl-10" />
        </label>
        <div className="flex rounded-full border border-white/[0.08] bg-white/[0.02] p-1" role="group" aria-label="Filtrar por status">
          {(
            [
              ['all', 'Todos'],
              ['active', 'Ativos'],
              ['inactive', 'Inativos'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={status === k}
              onClick={() => setStatus(k)}
              className={cn('rounded-full px-4 py-1.5 text-sm transition-colors', status === k ? 'bg-white/[0.09] text-cream' : 'text-mist hover:text-cream')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[88px] rounded-2xl" />
          ))}
        </div>
      ) : (data?.establishments.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Store className="size-5" />}
          title="Nenhum estabelecimento ainda"
          description="Cadastre o primeiro cliente: nome, endereço do cardápio e identidade visual."
          action={<Button onClick={() => setEditing('new')}>Cadastrar estabelecimento</Button>}
        />
      ) : list.length === 0 ? (
        <EmptyState icon={<Search className="size-5" />} title="Nada encontrado" description="Ajuste a busca ou o filtro de status." />
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {list.map((e) => {
            const logo = mediaUrl(e.logo_path)
            const owners = ownersOf[e.id]
            return (
              <li key={e.id} className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-navy-950/50 p-4 transition-colors hover:border-white/[0.12] lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {logo ? (
                    <img src={logo} alt="" className="size-12 shrink-0 rounded-xl border border-white/10 bg-navy-700 object-contain p-1" />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-lg font-semibold text-gold">
                      {e.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-cream">{e.name}</p>
                      <Badge tone={e.is_active ? 'mint' : 'neutral'}>{e.is_active ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                    <p className="mt-0.5 truncate font-[family-name:var(--font-ui)] text-xs text-dim">{publicMenuUrl(e.slug).replace(/^https?:\/\//, '')}</p>
                    <p className="mt-1 text-xs text-mist">
                      {menuThemes[e.theme_key]?.label ?? e.theme_key} · {owners ? owners.join(', ') : <span className="text-gold-soft">sem proprietário</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <div className="text-left lg:w-28 lg:text-right">
                    <p className="text-xs text-dim">Mensalidade</p>
                    <p className="text-cream tabular">{formatBRL(billingOf[e.id]?.monthly_fee ?? 0)}</p>
                  </div>
                  <Switch checked={e.is_active} onChange={(next) => toggleActive(e, next)} label={`Cardápio de ${e.name} ativo`} />
                  <RowMenu
                    e={e}
                    onEdit={() => setEditing(e)}
                    onDelete={() => setDeleting(e)}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <EstablishmentForm
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        open={editing !== null}
        establishment={editing === 'new' ? null : editing}
        billing={editing && editing !== 'new' ? billingOf[editing.id] : undefined}
        existingSlugs={(data?.establishments ?? []).filter((x) => editing === 'new' || x.id !== editing?.id).map((x) => x.slug)}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          reload(true)
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busyDelete}
        title={`Excluir ${deleting?.name ?? ''}?`}
        description="Categorias, produtos, visitas registradas e o vínculo do proprietário serão apagados. O endereço do QR Code deixa de funcionar. Para pausar o cardápio sem perder dados, prefira desativar."
        confirmLabel="Excluir definitivamente"
      />
    </>
  )
}

function RowMenu({ e, onEdit, onDelete }: { e: Establishment; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-1">
      <IconButton label={`Editar ${e.name}`} onClick={onEdit}>
        <Pencil className="size-4" />
      </IconButton>
      <div className="relative">
        <IconButton label="Mais ações" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>
          <Ellipsis className="size-4" />
        </IconButton>
        {open && (
          <>
            <button type="button" aria-hidden tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)} />
            <div
              role="menu"
              className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-navy-800 p-1.5 shadow-2xl"
              onKeyDown={(ev) => ev.key === 'Escape' && setOpen(false)}
            >
              {[
                { icon: ArrowUpRight, label: 'Abrir cardápio público', href: `/table/${e.slug}`, external: true },
                { icon: UtensilsCrossed, label: 'Gerenciar cardápio', href: `/admin/cardapios?e=${e.id}` },
                { icon: UserPlus, label: 'Vincular proprietário', href: `/admin/usuarios?convidar=${e.id}` },
                { icon: QrCode, label: 'Gerar QR Code', href: `/admin/qr-codes?e=${e.id}` },
              ].map((item) =>
                item.external ? (
                  <a key={item.label} role="menuitem" href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-cream hover:bg-white/[0.06]">
                    <item.icon className="size-4 text-gold" aria-hidden /> {item.label}
                  </a>
                ) : (
                  <Link key={item.label} role="menuitem" to={item.href} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-cream hover:bg-white/[0.06]">
                    <item.icon className="size-4 text-gold" aria-hidden /> {item.label}
                  </Link>
                ),
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onDelete()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-soft hover:bg-red/10"
              >
                <Trash2 className="size-4" aria-hidden /> Excluir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EstablishmentForm({
  open,
  establishment: est,
  billing,
  existingSlugs,
  onClose,
  onSaved,
}: {
  open: boolean
  establishment: Establishment | null
  billing?: Billing
  existingSlugs: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [name, setName] = useState(est?.name ?? '')
  const [slug, setSlug] = useState(est?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(est))
  const [theme, setTheme] = useState(est?.theme_key ?? 'base')
  const [active, setActive] = useState(est?.is_active ?? true)
  const [tagline, setTagline] = useState(est?.tagline ?? '')
  const [address, setAddress] = useState(est?.address ?? '')
  const [hours, setHours] = useState(est?.opening_hours ?? '')
  const [instagram, setInstagram] = useState(est?.instagram ?? '')
  const [externalUrl, setExternalUrl] = useState(est?.external_url ?? '')
  const [fee, setFee] = useState(priceToInput(billing?.monthly_fee ?? 0))
  const [notes, setNotes] = useState(billing?.notes ?? '')
  const [dueDay, setDueDay] = useState(billing?.due_day ? String(billing.due_day) : '')
  const [contractStart, setContractStart] = useState(billing?.contract_start ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const s = slug.trim()
    const parsedFee = parseBRL(fee || '0')
    if (name.trim().length < 2) errs.name = 'Informe o nome do estabelecimento.'
    if (!SLUG_PATTERN.test(s) || s.length < 2) errs.slug = 'Use letras minúsculas, números e hífens. Ex.: casa-do-chef'
    else if (existingSlugs.includes(s)) errs.slug = 'Este endereço já está em uso.'
    if (externalUrl.trim() && !/^https:\/\/.+\..+/.test(externalUrl.trim())) errs.externalUrl = 'Use um endereço completo começando com https://'
    if (parsedFee === null || parsedFee < 0) errs.fee = 'Valor inválido.'
    if (dueDay && !(Number(dueDay) >= 1 && Number(dueDay) <= 28)) errs.dueDay = 'Use um dia entre 1 e 28.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    let uploaded: string | null = null
    try {
      const base = {
        name: name.trim(),
        slug: s,
        theme_key: theme,
        is_active: active,
        tagline: tagline.trim() || null,
        address: address.trim() || null,
        opening_hours: hours.trim() || null,
        instagram: instagram.trim() || null,
        external_url: externalUrl.trim() || null,
        logo_path: logoRemoved ? null : (est?.logo_path ?? null),
      }
      let saved = await saveEstablishment(base, est?.id)
      if (logoFile) {
        uploaded = await uploadMedia(saved.id, 'brand', logoFile)
        saved = await saveEstablishment({ ...base, logo_path: uploaded }, saved.id)
      }
      if (est?.logo_path && est.logo_path !== saved.logo_path) await removeMedia([est.logo_path]).catch(() => {})
      await saveBilling(saved.id, parsedFee!, notes.trim() || null, { due_day: dueDay ? Number(dueDay) : null, contract_start: contractStart || null })
      toast.success(est ? 'Estabelecimento atualizado.' : 'Estabelecimento cadastrado. Agora convide o proprietário.')
      onSaved()
    } catch (err) {
      if (uploaded) await removeMedia([uploaded]).catch(() => {})
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      title={est ? `Editar ${est.name}` : 'Novo estabelecimento'}
      description="Os dados de identidade aparecem no cardápio público. A mensalidade é visível só para o Super Admin."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="est-form" loading={saving}>
            {est ? 'Salvar alterações' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <form id="est-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-8">
        <fieldset className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
          <legend className="eyebrow mb-4 text-dim">Identificação</legend>
          <div className="grid grid-cols-1 content-start gap-5">
            <Field label="Nome" error={errors.name}>
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={Boolean(errors.name)}
                  value={name}
                  maxLength={120}
                  data-autofocus
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slugTouched) setSlug(slugify(e.target.value))
                  }}
                />
              )}
            </Field>
            <Field
              label="Endereço do cardápio (slug)"
              error={errors.slug}
              hint={
                <span className="font-[family-name:var(--font-ui)]">
                  {publicMenuUrl(slug || 'nome-do-local').replace(/^https?:\/\//, '')}
                  {est && est.slug !== slug && <span className="mt-1 block font-sans text-gold-soft">Atenção: QR Codes já impressos apontam para o endereço antigo.</span>}
                </span>
              }
            >
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={Boolean(errors.slug)}
                  value={slug}
                  maxLength={60}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }}
                  className="font-[family-name:var(--font-ui)] text-sm"
                />
              )}
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-navy-950/50 px-4 py-3.5">
              <div>
                <p className="font-medium text-cream">Cardápio ativo</p>
                <p className="text-sm text-dim">Desativado, o endereço público mostra “indisponível”.</p>
              </div>
              <Switch checked={active} onChange={setActive} label="Cardápio ativo" />
            </div>
          </div>
          <ImageField
            label="Logo"
            aspect="aspect-square"
            currentPath={est?.logo_path ?? null}
            file={logoFile}
            removed={logoRemoved}
            onFile={(f) => {
              setLogoFile(f)
              if (f) setLogoRemoved(false)
            }}
            onRemove={() => setLogoRemoved(true)}
          />
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <legend className="eyebrow mb-4 text-dim">Identidade e publicação</legend>
          <Field label="Identidade do cardápio" hint={menuThemes[theme]?.description} className="sm:col-span-2">
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={theme} onChange={(e) => setTheme(e.target.value)}>
                {Object.entries(menuThemes).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Frase de apresentação" optional>
            {(id) => <Input id={id} value={tagline} maxLength={160} onChange={(e) => setTagline(e.target.value)} placeholder="Ex.: Cozinha autoral desde 2010" />}
          </Field>
          <Field label="Horário" optional>
            {(id) => <Input id={id} value={hours} maxLength={200} onChange={(e) => setHours(e.target.value)} placeholder="Ter a dom · 12h às 23h" />}
          </Field>
          <Field label="Endereço" optional>
            {(id) => <Input id={id} value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} />}
          </Field>
          <Field label="Instagram" optional>
            {(id) => <Input id={id} value={instagram} maxLength={60} onChange={(e) => setInstagram(e.target.value)} placeholder="@seurestaurante" />}
          </Field>
          <Field
            label="URL externa do cardápio"
            optional
            error={errors.externalUrl}
            hint="Só para cardápios hospedados em outro projeto. O QR Code continua apontando para o endereço acima, que redireciona."
            className="sm:col-span-2"
          >
            {(id, d) => (
              <Input
                id={id}
                aria-describedby={d}
                aria-invalid={Boolean(errors.externalUrl)}
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://"
                className="font-[family-name:var(--font-ui)] text-sm"
              />
            )}
          </Field>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <legend className="eyebrow mb-4 text-dim">Financeiro (privado)</legend>
          <Field label="Mensalidade" error={errors.fee}>
            {(id, d) => (
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-dim">R$</span>
                <Input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={Boolean(errors.fee)}
                  inputMode="decimal"
                  value={fee}
                  onChange={(e) => setFee(e.target.value.replace(/[^\d,.]/g, ''))}
                  onBlur={() => {
                    const v = parseBRL(fee)
                    if (v !== null) setFee(priceToInput(v))
                  }}
                  className="pl-10 tabular"
                />
              </div>
            )}
          </Field>
          <Field label="Dia de vencimento" optional error={errors.dueDay} hint="De 1 a 28">
            {(id, d) => (
              <Input id={id} aria-describedby={d} aria-invalid={Boolean(errors.dueDay)} inputMode="numeric" value={dueDay} maxLength={2} onChange={(e) => setDueDay(e.target.value.replace(/D/g, ''))} className="tabular" />
            )}
          </Field>
          <Field label="Início do contrato" optional>
            {(id) => <Input id={id} type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} className="tabular" />}
          </Field>
          <Field label="Observações" optional className="sm:col-span-3">
            {(id) => <Textarea id={id} value={notes} maxLength={500} rows={2} onChange={(e) => setNotes(e.target.value)} className="min-h-11" />}
          </Field>
        </fieldset>
      </form>
    </Modal>
  )
}

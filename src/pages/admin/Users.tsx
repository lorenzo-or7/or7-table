import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Clock, KeyRound, MailPlus, RefreshCw, ShieldAlert, ShieldCheck, ShieldOff, Trash2, UserMinus, UsersRound, X } from 'lucide-react'
import { Badge, Button, EmptyState, Field, IconButton, Input, Select } from '@/components/ui/primitives'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlays'
import { ErrorBanner, PageHeader } from '@/components/panel/PanelLayout'
import {
  callInviteFunction,
  createInviteRecord,
  deleteInvite,
  listEstablishments,
  listAccounts,
  listSecurityEvents,
  listInvites,
  updateProfile,
  useLoader,
} from '@/lib/data'
import { formatDate, initials, isValidEmail } from '@/lib/format'
import { friendlyError, supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { publicSiteUrl } from '@/lib/site'
import type { Account, Profile, SecurityEvent } from '@/lib/types'

type Pending = { kind: 'unlink' | 'delete' | 'reset_mfa'; profile: Profile } | null

export default function Users() {
  const toast = useToast()
  const { profile: me } = useAuth()
  const [params, setParams] = useSearchParams()
  const { data, setData, loading, error, reload } = useLoader(async () => {
    const [profiles, establishments, invites, events] = await Promise.all([listAccounts(), listEstablishments(), listInvites(), listSecurityEvents(15)])
    return { profiles, establishments, invites, events }
  }, [])
  const [inviteFor, setInviteFor] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const target = params.get('convidar')
    if (target) {
      setInviteFor(target)
      params.delete('convidar')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const estName = useMemo(() => Object.fromEntries((data?.establishments ?? []).map((e) => [e.id, e.name])), [data])
  const owners = (data?.profiles ?? []).filter((p) => p.role === 'owner')
  const admins = (data?.profiles ?? []).filter((p) => p.role === 'super_admin')

  const relink = async (p: Profile, establishment_id: string | null) => {
    const prev = p.establishment_id
    setData((d) => d && { ...d, profiles: d.profiles.map((x) => (x.id === p.id ? { ...x, establishment_id } : x)) })
    try {
      await updateProfile(p.id, { establishment_id })
      toast.success(establishment_id ? `Acesso vinculado a ${estName[establishment_id]}.` : 'Acesso removido.')
    } catch (err) {
      setData((d) => d && { ...d, profiles: d.profiles.map((x) => (x.id === p.id ? { ...x, establishment_id: prev } : x)) })
      toast.error(friendlyError(err))
    }
  }

  const [resending, setResending] = useState<string | null>(null)
  const resend = async (p: Account) => {
    setResending(p.id)
    try {
      await callInviteFunction({ action: 'resend', user_id: p.id, redirect_to: `${publicSiteUrl()}/redefinir-senha` })
      toast.success(`Novo convite enviado para ${p.email}.`)
      reload(true)
    } catch (err) {
      const e = err as Error & { notDeployed?: boolean }
      toast.error(e.notDeployed ? 'Publique a função invite-owner no Supabase para reenviar convites.' : friendlyError(err))
    } finally {
      setResending(null)
    }
  }

  const sendReset = async (p: Profile) => {
    if (!supabase) return
    const { error: err } = await supabase.auth.resetPasswordForEmail(p.email, { redirectTo: `${publicSiteUrl()}/redefinir-senha` })
    if (err) toast.error(friendlyError(err))
    else toast.success(`Link de nova senha enviado para ${p.email}.`)
  }

  const confirmPending = async () => {
    if (!pending) return
    setBusy(true)
    try {
      if (pending.kind === 'unlink') {
        await relink(pending.profile, null)
      } else if (pending.kind === 'reset_mfa') {
        if (reason.trim().length < 10) {
          toast.error('Descreva como a identidade foi confirmada (mínimo de 10 caracteres).')
          return
        }
        await callInviteFunction({ action: 'reset_mfa', user_id: pending.profile.id, reason: reason.trim() })
        setData((d) => d && { ...d, profiles: d.profiles.map((x) => (x.id === pending.profile.id ? { ...x, mfa_enabled: false } : x)) })
        toast.success('Authenticator removido. No próximo acesso, a pessoa cadastra um novo.')
        setReason('')
        reload(true)
      } else {
        await callInviteFunction({ action: 'remove', user_id: pending.profile.id })
        setData((d) => d && { ...d, profiles: d.profiles.filter((x) => x.id !== pending.profile.id) })
        toast.success('Conta excluída.')
      }
      setPending(null)
    } catch (err) {
      const e = err as Error & { notDeployed?: boolean }
      toast.error(
        e.notDeployed
          ? 'A função invite-owner não está publicada. Exclua a conta em Supabase → Authentication → Users.'
          : friendlyError(err),
      )
    } finally {
      setBusy(false)
    }
  }

  const cancelInvite = async (id: string) => {
    try {
      await deleteInvite(id)
      setData((d) => d && { ...d, invites: d.invites.filter((i) => i.id !== id) })
      toast.success('Convite cancelado.')
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Acessos"
        title="Usuários e acessos"
        description="Cada administrador de restaurante acessa somente o cardápio do estabelecimento vinculado. Não existe cadastro público: todo acesso nasce aqui."
        actions={
          <Button icon={<MailPlus className="size-4" />} onClick={() => setInviteFor('')}>
            Criar acesso de restaurante
          </Button>
        }
      />
      <ErrorBanner error={error} onRetry={() => reload()} />

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[76px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
          <section aria-labelledby="owners-title">
            <h2 id="owners-title" className="mb-4 flex items-baseline gap-2 font-semibold text-cream">
              Administradores de restaurante <span className="text-sm font-normal text-dim">{owners.length}</span>
            </h2>
            {owners.length === 0 ? (
              <EmptyState
                icon={<UsersRound className="size-5" />}
                title="Nenhum administrador de restaurante ainda"
                description="Convide o responsável por cada estabelecimento. Ele recebe um e-mail para criar a própria senha."
                action={<Button onClick={() => setInviteFor('')}>Criar acesso de restaurante</Button>}
              />
            ) : (
              <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/50">
                {owners.map((p) => (
                  <li key={p.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.06] text-sm font-semibold text-cream">
                        {initials(p.full_name || p.email)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-cream">{p.full_name || 'Sem nome'}</p>
                        <p className="truncate text-sm text-dim">{p.email}</p>
                        <AccessStatus account={p} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`link-${p.id}`}>
                        Estabelecimento de {p.email}
                      </label>
                      <div className="w-[220px]">
                      <Select
                        id={`link-${p.id}`}
                        value={p.establishment_id ?? ''}
                        onChange={(e) => relink(p, e.target.value || null)}
                        className="h-10 text-sm"
                      >
                        <option value="">Sem acesso</option>
                        {data?.establishments.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </Select>
                      </div>
                      {!p.last_sign_in_at && p.invited_at && (
                        <IconButton label={`Reenviar convite para ${p.email}`} onClick={() => resend(p)} disabled={resending === p.id || !p.establishment_id}>
                          <RefreshCw className={`size-4 ${resending === p.id ? 'animate-spin' : ''}`} />
                        </IconButton>
                      )}
                      <IconButton label={`Enviar link de nova senha para ${p.email}`} onClick={() => sendReset(p)}>
                        <KeyRound className="size-4" />
                      </IconButton>
                      <IconButton label={`Remover acesso de ${p.email}`} onClick={() => setPending({ kind: 'unlink', profile: p })} disabled={!p.establishment_id}>
                        <UserMinus className="size-4" />
                      </IconButton>
                      {p.mfa_enabled && (
                        <IconButton label={`Redefinir Authenticator de ${p.email}`} onClick={() => setPending({ kind: 'reset_mfa', profile: p })}>
                          <ShieldOff className="size-4" />
                        </IconButton>
                      )}
                      <IconButton label={`Excluir conta de ${p.email}`} tone="danger" onClick={() => setPending({ kind: 'delete', profile: p })}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(data?.invites.length ?? 0) > 0 && (
            <section aria-labelledby="invites-title">
              <h2 id="invites-title" className="mb-4 flex items-baseline gap-2 font-semibold text-cream">
                Convites pendentes <span className="text-sm font-normal text-dim">{data!.invites.length}</span>
              </h2>
              <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-dashed border-white/10">
                {data!.invites.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 p-4">
                    <Clock className="size-4 shrink-0 text-gold" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-cream">{i.email}</p>
                      <p className="truncate text-sm text-dim">
                        {estName[i.establishment_id] ?? 'Estabelecimento removido'} · enviado em {formatDate(i.created_at)}
                        {i.expires_at && (new Date(i.expires_at) < new Date() ? ' · vencido, cancele e convide de novo' : ` · vale até ${formatDate(i.expires_at)}`)}
                      </p>
                    </div>
                    <IconButton label={`Cancelar convite de ${i.email}`} onClick={() => cancelInvite(i.id)}>
                      <X className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="admins-title">
            <h2 id="admins-title" className="mb-4 flex items-baseline gap-2 font-semibold text-cream">
              Super Admins <span className="text-sm font-normal text-dim">{admins.length}</span>
            </h2>
            <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/30">
              {admins.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-4">
                  <ShieldCheck className="size-5 shrink-0 text-gold" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-cream">{p.full_name || p.email}</p>
                    <p className="truncate text-sm text-dim">{p.email}</p>
                  </div>
                  {p.id === me?.id && <Badge tone="gold">Você</Badge>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-dim">O acesso de Super Admin só é concedido direto no banco, pelo script supabase/bootstrap_super_admin.sql. Ninguém consegue se promover pelo painel.</p>
          </section>
          <SecurityLog events={data?.events ?? null} emailOf={Object.fromEntries((data?.profiles ?? []).map((p) => [p.id, p.email]))} />
        </div>
      )}

      <InviteModal
        key={inviteFor ?? 'closed'}
        open={inviteFor !== null}
        defaultEstablishment={inviteFor ?? ''}
        establishments={data?.establishments ?? []}
        onClose={() => setInviteFor(null)}
        onDone={() => {
          setInviteFor(null)
          reload(true)
        }}
      />

      <ConfirmDialog
        open={pending !== null}
        onClose={() => {
          setPending(null)
          setReason('')
        }}
        onConfirm={confirmPending}
        loading={busy}
        title={pending?.kind === 'delete' ? 'Excluir conta?' : pending?.kind === 'reset_mfa' ? 'Redefinir o Authenticator?' : 'Remover acesso?'}
        description={
          pending?.kind === 'delete'
            ? `A conta ${pending.profile.email} será apagada. Para acessar de novo, será preciso um novo convite.`
            : pending?.kind === 'reset_mfa'
              ? `Use só depois de confirmar a identidade de ${pending.profile.email} por um canal independente (ligação ou contato já conhecido). O Authenticator atual deixa de valer e um novo será exigido no próximo login.`
              : `${pending?.profile.email ?? ''} continua com login, mas deixa de ver e editar qualquer cardápio.`
        }
        confirmLabel={pending?.kind === 'delete' ? 'Excluir conta' : pending?.kind === 'reset_mfa' ? 'Redefinir Authenticator' : 'Remover acesso'}
      >
        {pending?.kind === 'reset_mfa' && (
          <Field label="Como a identidade foi confirmada" hint="Fica registrado no histórico de segurança. Não escreva senhas nem códigos." className="mt-4">
            {(id, d) => <Input id={id} aria-describedby={d} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: ligação para o telefone do contrato em 13/11" />}
          </Field>
        )}
      </ConfirmDialog>
    </>
  )
}

function InviteModal({
  open,
  defaultEstablishment,
  establishments,
  onClose,
  onDone,
}: {
  open: boolean
  defaultEstablishment: string
  establishments: { id: string; name: string }[]
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [est, setEst] = useState(defaultEstablishment || establishments[0]?.id || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [fallback, setFallback] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const normalized = email.trim().toLowerCase()
    if (!isValidEmail(normalized)) errs.email = 'Informe um e-mail válido.'
    if (!est) errs.est = 'Escolha o estabelecimento.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const res = await callInviteFunction({
        action: 'invite',
        email: normalized,
        full_name: name.trim() || null,
        establishment_id: est,
        redirect_to: `${publicSiteUrl()}/redefinir-senha`,
      })
      toast.success(res.status === 'linked' ? 'Conta existente vinculada ao estabelecimento.' : `Convite enviado para ${normalized}.`)
      onDone()
    } catch (err) {
      const ex = err as Error & { notDeployed?: boolean }
      if (ex.notDeployed) {
        // Sem a função publicada: registra o convite e orienta o envio manual pelo Supabase.
        try {
          await createInviteRecord(normalized, name.trim() || null, est)
          setFallback(true)
        } catch (inner) {
          toast.error(friendlyError(inner))
        }
      } else {
        toast.error(friendlyError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      size="sm"
      title={fallback ? 'Convite registrado' : 'Criar acesso de restaurante'}
      description={fallback ? undefined : 'A pessoa recebe um e-mail para criar a própria senha e entra direto no painel do restaurante, com acesso só a produtos, categorias, fotos, preços e disponibilidade.'}
      footer={
        fallback ? (
          <Button onClick={onDone}>Entendi</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" form="invite-form" loading={busy} disabled={establishments.length === 0}>
              Enviar convite
            </Button>
          </>
        )
      }
    >
      {fallback ? (
        <div className="grid grid-cols-1 gap-3 text-sm leading-relaxed text-mist">
          <p>
            A função <code className="font-[family-name:var(--font-ui)] text-xs text-cream">invite-owner</code> ainda não foi publicada no Supabase, então o
            e-mail não saiu automaticamente. O vínculo já está guardado:
          </p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Abra Supabase → Authentication → Users → <strong className="text-cream">Invite user</strong>.
            </li>
            <li>
              Convide <strong className="text-cream">{email.trim().toLowerCase()}</strong>.
            </li>
            <li>Quando a conta for criada, ela é ligada ao estabelecimento automaticamente.</li>
          </ol>
        </div>
      ) : establishments.length === 0 ? (
        <EmptyState className="py-8" title="Cadastre um estabelecimento antes" description="O convite precisa estar ligado a um estabelecimento." />
      ) : (
        <form id="invite-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-5">
          <Field label="E-mail" error={errors.email}>
            {(id, d) => (
              <Input id={id} aria-describedby={d} aria-invalid={Boolean(errors.email)} type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-autofocus />
            )}
          </Field>
          <Field label="Nome" optional>
            {(id) => <Input id={id} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Field label="Estabelecimento" error={errors.est}>
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={est} onChange={(e) => setEst(e.target.value)}>
                {establishments.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </form>
      )}
    </Modal>
  )
}

/** Situação do acesso: convite aguardando, ativo (último acesso) ou sem dados (migração 0003 pendente). */
function AccessStatus({ account: a }: { account: Account }) {
  if (a.last_sign_in_at)
    return (
      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-dim">
        Último acesso em {formatDate(a.last_sign_in_at)}
        {a.mfa_enabled === true && <Badge tone="mint">Authenticator ativo</Badge>}
        {a.mfa_enabled === false && <Badge tone="gold">Authenticator pendente</Badge>}
      </p>
    )
  if (a.invited_at)
    return (
      <p className="mt-1.5">
        <Badge tone="gold">Convite enviado em {formatDate(a.invited_at)} · aguardando primeiro acesso</Badge>
      </p>
    )
  return null
}

const EVENT_LABEL: Record<SecurityEvent['event'], string> = {
  mfa_enrolled: 'Authenticator cadastrado',
  mfa_verified: 'Login com Authenticator',
  mfa_challenge_failed: 'Código incorreto',
  mfa_reset_by_admin: 'Authenticator redefinido pelo Super Admin',
  mfa_reset_denied: 'Ação administrativa negada sem MFA',
}

/** Histórico de segurança: quem, o quê e quando. Nunca guarda códigos, segredos ou tokens. */
function SecurityLog({ events, emailOf }: { events: SecurityEvent[] | null; emailOf: Record<string, string> }) {
  if (events === null) return null
  return (
    <section aria-labelledby="sec-title">
      <h2 id="sec-title" className="mb-4 flex items-center gap-2 font-semibold text-cream">
        <ShieldAlert className="size-4 text-gold" aria-hidden /> Eventos de segurança recentes
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-dim">Nenhum evento registrado ainda.</p>
      ) : (
        <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/50 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3">
              <span className={e.event === 'mfa_challenge_failed' || e.event === 'mfa_reset_denied' ? 'text-red-soft' : 'text-cream'}>{EVENT_LABEL[e.event] ?? e.event}</span>
              <span className="text-xs text-dim">
                {(e.target_id && emailOf[e.target_id]) || (e.actor_id && emailOf[e.actor_id]) || 'Conta removida'} · {new Date(e.created_at).toLocaleString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

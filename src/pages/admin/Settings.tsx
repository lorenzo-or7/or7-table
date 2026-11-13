import { useState, type FormEvent } from 'react'
import { CheckCircle2, CircleAlert, Database, Globe } from 'lucide-react'
import { WhatsAppLogo } from '@/components/brand/WhatsApp'
import { Button, Field, Input, cn } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/overlays'
import { PageHeader } from '@/components/panel/PanelLayout'
import { useAuth } from '@/lib/auth'
import { updateProfile } from '@/lib/data'
import { friendlyError, isSupabaseConfigured, supabase, supabaseUrl } from '@/lib/supabase'
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, isSiteUrlConfigured, publicSiteUrl } from '@/lib/site'

function Status({ ok, title, detail, icon }: { ok: boolean; title: string; detail: string; icon: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4 p-4">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl border [&>svg]:size-4', ok ? 'border-mint/25 bg-mint/10 text-mint' : 'border-gold/30 bg-gold/10 text-gold')}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium text-cream">
          {title}
          {ok ? <CheckCircle2 className="size-4 text-mint" aria-label="configurado" /> : <CircleAlert className="size-4 text-gold" aria-label="pendente" />}
        </p>
        <p className="mt-0.5 text-sm break-words text-dim">{detail}</p>
      </div>
    </li>
  )
}

export default function Settings() {
  const toast = useToast()
  const { profile, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [savingPw, setSavingPw] = useState(false)

  const saveName = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSavingName(true)
    try {
      await updateProfile(profile.id, { full_name: name.trim() || null })
      await refreshProfile()
      toast.success('Nome atualizado.')
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSavingName(false)
    }
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return setPwError('Use pelo menos 8 caracteres, com letras e números.')
    if (pw !== pw2) return setPwError('As senhas não conferem.')
    setPwError(null)
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSavingPw(false)
    if (error) return setPwError(friendlyError(error))
    setPw('')
    setPw2('')
    toast.success('Senha alterada.')
  }

  return (
    <>
      <PageHeader eyebrow="Sistema" title="Configurações" description="Situação da instalação e dados da sua conta." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-labelledby="env-title">
          <h2 id="env-title" className="mb-4 font-semibold text-cream">
            Ambiente
          </h2>
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-navy-950/50">
            <Status
              ok={isSupabaseConfigured}
              icon={<Database />}
              title="Supabase"
              detail={isSupabaseConfigured ? `Conectado a ${supabaseUrl.replace(/^https:\/\//, '')}` : 'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'}
            />
            <Status
              ok={isSiteUrlConfigured}
              icon={<Globe />}
              title="Domínio público dos QR Codes"
              detail={isSiteUrlConfigured ? publicSiteUrl() : `Usando o endereço atual (${publicSiteUrl()}). Defina VITE_PUBLIC_SITE_URL com o domínio definitivo.`}
            />
            <Status
              ok
              icon={<WhatsAppLogo className="size-[18px]" />}
              title="Contato comercial da landing page"
              detail={`WhatsApp ${WHATSAPP_DISPLAY}${CONTACT_EMAIL ? ` · ${CONTACT_EMAIL}` : ' · e-mail opcional (VITE_CONTACT_EMAIL)'}`}
            />
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-dim">
            Variáveis de ambiente entram no build. Depois de alterar o arquivo .env.local, gere o build novamente e envie a pasta dist para a hospedagem.
          </p>
        </section>

        <div className="grid grid-cols-1 content-start gap-6">
          <form onSubmit={saveName} className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6">
            <h2 className="font-semibold text-cream">Sua conta</h2>
            <p className="mt-1 text-sm text-dim">{profile?.email}</p>
            <Field label="Nome" className="mt-5">
              {(id) => <Input id={id} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />}
            </Field>
            <Button type="submit" variant="secondary" loading={savingName} className="mt-4">
              Salvar nome
            </Button>
          </form>

          <form onSubmit={savePassword} noValidate className="rounded-2xl border border-white/[0.07] bg-navy-950/50 p-5 sm:p-6">
            <h2 className="font-semibold text-cream">Alterar senha</h2>
            <div className="mt-5 grid gap-4">
              <Field label="Nova senha">
                {(id) => <Input id={id} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />}
              </Field>
              <Field label="Confirme a nova senha" error={pwError}>
                {(id, d) => (
                  <Input id={id} aria-describedby={d} aria-invalid={Boolean(pwError)} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                )}
              </Field>
            </div>
            <Button type="submit" loading={savingPw} className="mt-4">
              Alterar senha
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}

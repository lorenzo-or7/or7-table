// Or7 Table — provisionamento seguro de proprietários (Supabase Edge Function)
//
// Publicação (uma vez):
//   npx supabase login
//   npx supabase functions deploy invite-owner --project-ref SEU-PROJETO
// ou: Dashboard → Edge Functions → Deploy a new function → cole este arquivo
//     com o nome "invite-owner".
//
// A função roda nos servidores do Supabase. A chave secreta (SUPABASE_SECRET_KEYS, ou a
// legada SUPABASE_SERVICE_ROLE_KEY) é injetada pelo Supabase e NUNCA chega ao navegador.
// Mantenha "Verify JWT" LIGADO: a função só é chamada pelo painel, com o token do usuário,
// e ainda confere sessão, papel super_admin e MFA (aal2) por conta própria.
// Só usuários com role = 'super_admin' em public.profiles conseguem executá-la.
//
// Ações (POST JSON):
//   { action: "invite", email, full_name?, establishment_id, redirect_to }
//   { action: "resend", user_id, redirect_to } → novo link para quem nunca entrou
//   { action: "remove", user_id }   → exclui a conta de um proprietário
//   { action: "reset_mfa", user_id, reason } → remove o Authenticator de um proprietário que o perdeu
//
// Toda ação exige: sessão válida + papel super_admin + MFA concluído (aal2) no token.
//
// Nenhuma senha é criada ou enviada: o convidado define a própria senha no link.

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Lê a chave "default" do dicionário JSON novo; se não existir, usa a variável legada. */
function envKey(dictName: string, legacyName: string): string {
  try {
    const dict = JSON.parse(Deno.env.get(dictName) ?? '{}') as Record<string, string>
    if (dict.default) return dict.default
  } catch {
    /* formato inesperado: tenta a legada */
  }
  return Deno.env.get(legacyName) ?? ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  // Chaves novas (publishable/secret) com recuo para as legadas (anon/service_role),
  // que o Supabase descontinua até o fim de 2026. Todas são injetadas pelo próprio Supabase.
  const anonKey = envKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')
  const serviceKey = envKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return json({ error: 'Função sem configuração do servidor.' }, 500)

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'Sessão inválida. Entre novamente.' }, 401)
  const asCaller = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  // o token precisa ir explícito: no servidor não existe sessão salva para getUser() ler
  const { data: userData, error: userError } = await asCaller.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Sessão inválida. Entre novamente.' }, 401)

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  // O token já foi validado pelo getUser acima; o nível de autenticação vem das claims dele.
  const aal = (() => {
    try {
      const payload = token.split('.')[1] ?? ''
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).aal as string | undefined
    } catch {
      return undefined
    }
  })()
  if (aal !== 'aal2') {
    await admin.from('security_events').insert({ actor_id: userData.user.id, event: 'mfa_reset_denied', details: { reason: 'aal1' } })
    return json({ error: 'Confirme o código do Authenticator antes desta ação.' }, 403)
  }

  const { data: caller } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
  if (caller?.role !== 'super_admin') return json({ error: 'Acesso restrito ao administrador.' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Requisição inválida.' }, 400)
  }

  if (body.action === 'invite') {
    const email = String(body.email ?? '').trim().toLowerCase()
    const fullName = String(body.full_name ?? '').trim().slice(0, 120) || null
    const establishmentId = String(body.establishment_id ?? '')
    const redirectTo = typeof body.redirect_to === 'string' ? body.redirect_to : undefined

    if (!EMAIL.test(email)) return json({ error: 'Informe um e-mail válido.' }, 400)
    const { data: est } = await admin.from('establishments').select('id').eq('id', establishmentId).maybeSingle()
    if (!est) return json({ error: 'Estabelecimento não encontrado.' }, 404)

    // Conta já existe? Só vincula ao estabelecimento.
    const { data: existing } = await admin.from('profiles').select('id, role').ilike('email', email).maybeSingle()
    if (existing) {
      if (existing.role === 'super_admin') return json({ error: 'Este e-mail pertence a um administrador.' }, 409)
      const { error } = await admin
        .from('profiles')
        .update({ establishment_id: establishmentId, ...(fullName ? { full_name: fullName } : {}) })
        .eq('id', existing.id)
      if (error) return json({ error: error.message }, 400)
      return json({ status: 'linked' })
    }

    // Convite pendente: o gatilho handle_new_user faz o vínculo quando a conta nasce.
    await admin.from('owner_invites').delete().ilike('email', email).is('accepted_at', null)
    const { error: inviteRowError } = await admin
      .from('owner_invites')
      .insert({ email, full_name: fullName, establishment_id: establishmentId, invited_by: userData.user.id })
    if (inviteRowError) return json({ error: inviteRowError.message }, 400)

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo,
    })
    if (error) return json({ error: error.message }, 400)
    return json({ status: 'invited' })
  }

  if (body.action === 'resend') {
    const userId = String(body.user_id ?? '')
    const redirectTo = typeof body.redirect_to === 'string' ? body.redirect_to : undefined
    const { data: target } = await admin.from('profiles').select('email, full_name, role, establishment_id').eq('id', userId).maybeSingle()
    if (!target) return json({ error: 'Usuário não encontrado.' }, 404)
    if (target.role === 'super_admin') return json({ error: 'Administradores não recebem convite por aqui.' }, 409)
    if (!target.establishment_id) return json({ error: 'Vincule a conta a um estabelecimento antes de reenviar.' }, 409)
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    if (authUser?.user?.last_sign_in_at) return json({ error: 'Esta conta já está ativa. Use "Esqueci minha senha" no login.' }, 409)

    // Link de convite só vale uma vez e por tempo limitado: recria a conta pendente
    // (ainda sem acesso) e envia um link novo. O vínculo volta pelo convite registrado.
    await admin.from('owner_invites').delete().ilike('email', target.email).is('accepted_at', null)
    const { data: prev } = await admin.from('owner_invites').select('send_count').ilike('email', target.email).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const { error: rowError } = await admin.from('owner_invites').insert({
      email: target.email,
      full_name: target.full_name,
      establishment_id: target.establishment_id,
      invited_by: userData.user.id,
      send_count: Math.min(50, (prev?.send_count ?? 1) + 1),
    })
    if (rowError) return json({ error: rowError.message }, 400)
    const { error: delError } = await admin.auth.admin.deleteUser(userId)
    if (delError) return json({ error: delError.message }, 400)
    const { error } = await admin.auth.admin.inviteUserByEmail(target.email, { data: { full_name: target.full_name }, redirectTo })
    if (error) return json({ error: error.message }, 400)
    return json({ status: 'resent' })
  }

  if (body.action === 'reset_mfa') {
    const userId = String(body.user_id ?? '')
    const reason = String(body.reason ?? '').trim().slice(0, 300)
    if (reason.length < 10) return json({ error: 'Descreva como a identidade foi confirmada (mínimo de 10 caracteres).' }, 400)
    if (userId === userData.user.id) return json({ error: 'O Super Admin não redefine o próprio MFA pelo painel. Siga o procedimento de recuperação documentado.' }, 409)
    const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
    if (!target) return json({ error: 'Usuário não encontrado.' }, 404)
    if (target.role === 'super_admin') return json({ error: 'Contas de Super Admin seguem o procedimento de recuperação fora da aplicação.' }, 409)

    const { data: factors, error: listError } = await admin.auth.admin.mfa.listFactors({ userId })
    if (listError) return json({ error: listError.message }, 400)
    for (const f of factors?.factors ?? []) {
      const { error } = await admin.auth.admin.mfa.deleteFactor({ userId, id: f.id })
      if (error) return json({ error: error.message }, 400)
    }
    // Sem segredos no registro: só quem fez, para quem, quantos fatores e a justificativa.
    await admin.from('security_events').insert({
      actor_id: userData.user.id,
      target_id: userId,
      event: 'mfa_reset_by_admin',
      details: { factors_removed: factors?.factors?.length ?? 0, reason },
    })
    return json({ status: 'mfa_reset' })
  }

  if (body.action === 'remove') {
    const userId = String(body.user_id ?? '')
    const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
    if (!target) return json({ error: 'Usuário não encontrado.' }, 404)
    if (target.role === 'super_admin') return json({ error: 'Administradores não podem ser removidos por aqui.' }, 409)
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)
    return json({ status: 'removed' })
  }

  return json({ error: 'Ação desconhecida.' }, 400)
})

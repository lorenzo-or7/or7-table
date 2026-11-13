-- =============================================================================
-- Or7 Table — bootstrap do Super Admin (executar UMA vez, pelo dono da Or7)
--
-- Por que um script e não um botão: o papel super_admin só pode ser concedido por
-- quem tem acesso ao banco (SQL Editor do Supabase, papel postgres). A API não
-- consegue executar isto, e o gatilho protect_profile_fields (0005) impede que
-- QUALQUER sessão de usuário altere papéis — inclusive a do próprio Super Admin.
--
-- Pré-requisitos (nesta ordem):
--  1. Migrações 0001 → 0005 aplicadas.
--  2. Authentication → Users → Add user → Create new user
--     (seu e-mail + senha forte e única, marque "Auto Confirm User").
--  3. Troque o e-mail abaixo pelo mesmo e-mail e rode este arquivo no SQL Editor.
--  4. Entre em /entrar: o primeiro login exige cadastrar o Authenticator (MFA).
--
-- Salvaguardas:
--  - recusa rodar com o e-mail de exemplo;
--  - recusa rodar sem as migrações 0004/0005 (MFA e auditoria);
--  - recusa conta com e-mail não confirmado;
--  - recusa criar um SEGUNDO Super Admin (para trocar o dono, rebaixe o atual
--    antes, de forma consciente, no SQL Editor);
--  - não cria usuário nem senha: a conta precisa existir em Authentication;
--  - registra o evento em security_events (sem segredos).
-- Tudo roda numa transação: se qualquer verificação falhar, nada é alterado.
-- =============================================================================

do $$
declare
  target_email text := 'TROQUE-PELO-SEU-EMAIL@exemplo.com';
  target_id    uuid;
  confirmed    timestamptz;
  other_admin  text;
begin
  if target_email ilike 'TROQUE-PELO-SEU-EMAIL%' then
    raise exception 'Defina o e-mail do Super Admin na variável target_email antes de executar.';
  end if;

  if to_regprocedure('public.is_aal2()') is null
     or not exists (select 1 from pg_constraint
                     where conname = 'security_events_event_check'
                       and pg_get_constraintdef(oid) like '%super_admin_bootstrap%') then
    raise exception 'Rode as migrações 0004_mfa.sql e 0005_production_hardening.sql antes do bootstrap.';
  end if;

  select email into other_admin from public.profiles
   where role = 'super_admin' and lower(email) <> lower(target_email) limit 1;
  if other_admin is not null then
    raise exception 'Já existe um Super Admin (%). Nada foi alterado.', other_admin;
  end if;

  select id, email_confirmed_at into target_id, confirmed from auth.users where lower(email) = lower(target_email);
  if target_id is null then
    raise exception 'Usuário % não encontrado. Crie-o antes em Authentication → Users.', target_email;
  end if;
  if confirmed is null then
    raise exception 'O e-mail % ainda não foi confirmado. Recrie o usuário com "Auto Confirm User" marcado.', target_email;
  end if;

  insert into public.profiles (id, email, role, establishment_id)
  values (target_id, lower(target_email), 'super_admin', null)
  on conflict (id) do update set role = 'super_admin', establishment_id = null;

  insert into public.security_events (actor_id, target_id, event, details)
  values (null, target_id, 'super_admin_bootstrap', jsonb_build_object('via', 'sql_editor'));

  raise notice 'Super Admin configurado para %. No primeiro login, cadastre o Authenticator.', target_email;
end $$;

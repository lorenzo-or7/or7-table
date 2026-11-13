-- =============================================================================
-- Or7 Table — MFA obrigatório (TOTP / Authenticator) para toda operação administrativa
-- Rode depois da 0001–0003, no SQL Editor. Incremental: não apaga dados e pode ser
-- executado mais de uma vez.
--
-- Regra: uma sessão só acessa dados administrativos quando o JWT traz aal = 'aal2'
-- (senha + código do Authenticator). Com aal1 (só senha) o usuário logado não lê nem
-- grava nada: nem o próprio perfil. A autorização continua a mesma (papel + vínculo):
-- o MFA é uma exigência a mais, nunca um substituto.
--
-- O que NÃO muda: get_public_menu() e register_menu_view() continuam públicos
-- (cardápios abertos a qualquer visitante, sem login).
--
-- Antes de rodar, ative em Authentication → Multi-Factor → TOTP: "Enabled".
-- =============================================================================

-- 1. Nível de autenticação da sessão atual ------------------------------------
create or replace function public.is_aal2()
returns boolean language sql stable set search_path = public as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

-- 2. Papéis passam a exigir aal2 -----------------------------------------------
-- Todas as políticas e funções existentes usam estes dois auxiliares; exigir aal2
-- aqui fecha também as funções security definer (admin_accounts, admin_view_stats,
-- can_write_media) e o gatilho que protege o perfil contra autopromoção.
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_aal2()
     and exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function public.my_establishment_id()
returns uuid language sql stable security definer set search_path = public as $$
  select case when public.is_aal2()
              then (select establishment_id from public.profiles where id = auth.uid() and role = 'owner')
         end;
$$;

-- 3. Políticas RESTRITIVAS: somam-se às existentes (AND), não as substituem ------
do $$
declare
  t text;
begin
  foreach t in array array['establishments', 'establishment_billing', 'profiles', 'owner_invites',
                           'categories', 'products', 'menu_views', 'billing_payments']
  loop
    execute format('drop policy if exists "mfa: exige aal2" on public.%I', t);
    execute format(
      'create policy "mfa: exige aal2" on public.%I as restrictive for all to authenticated
         using (public.is_aal2()) with check (public.is_aal2())', t);
  end loop;
end $$;

-- Storage: fotografias e logos dos cardápios (leitura pública do bucket não muda)
drop policy if exists "menu-media: exige aal2" on storage.objects;
create policy "menu-media: exige aal2" on storage.objects
  as restrictive for all to authenticated
  using (bucket_id <> 'menu-media' or public.is_aal2())
  with check (bucket_id <> 'menu-media' or public.is_aal2());

-- 4. Registro de eventos de segurança (sem segredos, códigos ou tokens) ---------
create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  actor_id    uuid references auth.users(id) on delete set null,
  target_id   uuid references auth.users(id) on delete set null,
  event       text not null check (event in (
                'mfa_enrolled', 'mfa_challenge_failed', 'mfa_verified',
                'mfa_reset_by_admin', 'mfa_reset_denied')),
  details     jsonb not null default '{}'::jsonb check (pg_column_size(details) < 2000)
);
create index if not exists security_events_time_idx on public.security_events(created_at desc);
create index if not exists security_events_target_idx on public.security_events(target_id, created_at desc);

alter table public.security_events enable row level security;
revoke all on public.security_events from anon, authenticated;
grant select on public.security_events to authenticated;
-- a Edge Function (service_role) registra redefinições e tentativas negadas
grant select, insert on public.security_events to service_role;
grant usage, select on sequence public.security_events_id_seq to service_role;

drop policy if exists "security_events: admin read" on public.security_events;
create policy "security_events: admin read" on public.security_events
  for select to authenticated using (public.is_super_admin());

-- O próprio usuário registra os eventos do seu fluxo de MFA (inclusive em aal1:
-- o registro de "código errado" acontece antes do segundo fator). Só eventos do
-- próprio usuário, só da lista abaixo, sem texto livre.
create or replace function public.log_security_event(p_event text)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Sessão obrigatória.' using errcode = '42501';
  end if;
  if p_event not in ('mfa_enrolled', 'mfa_challenge_failed', 'mfa_verified') then
    raise exception 'Evento não permitido.' using errcode = '22023';
  end if;
  -- limite simples contra abuso: até 30 eventos por usuário a cada 10 minutos
  if (select count(*) from public.security_events
       where actor_id = auth.uid() and created_at > now() - interval '10 minutes') >= 30 then
    return;
  end if;
  insert into public.security_events (actor_id, target_id, event)
  values (auth.uid(), auth.uid(), p_event);
end $$;

revoke all on function public.log_security_event(text) from public;
grant execute on function public.log_security_event(text) to authenticated;

-- 5. Contas com situação do MFA (somente Super Admin com aal2) ------------------
drop function if exists public.admin_accounts();
create or replace function public.admin_accounts()
returns table (
  id uuid, email text, full_name text, role text, establishment_id uuid, created_at timestamptz,
  invited_at timestamptz, confirmed_at timestamptz, last_sign_in_at timestamptz, mfa_enabled boolean
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito.' using errcode = '42501';
  end if;
  return query
    select p.id, p.email, p.full_name, p.role, p.establishment_id, p.created_at,
           u.invited_at, u.email_confirmed_at, u.last_sign_in_at,
           exists (select 1 from auth.mfa_factors f where f.user_id = p.id and f.status = 'verified')
      from public.profiles p
      left join auth.users u on u.id = p.id
     order by p.created_at desc;
end $$;

revoke all on function public.admin_accounts() from public;
grant execute on function public.admin_accounts() to authenticated;

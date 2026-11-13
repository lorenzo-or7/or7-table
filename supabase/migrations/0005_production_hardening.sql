-- =============================================================================
-- Or7 Table — endurecimento para produção (auditoria antes do Supabase real)
-- Rode depois da 0001–0004. Incremental, não apaga dados e pode ser repetida.
--
--  1. Funções: search_path fixo em todas (alerta "Function Search Path Mutable")
--  2. Funções: EXECUTE só para quem precisa (nada de auxiliares administrativos
--     expostos ao visitante anônimo pela API)
--  3. Papel (role) não muda pela API, nem pelo próprio Super Admin: promoção
--     só pelo SQL Editor (bootstrap). Fecha a criação de um 2º Super Admin a
--     partir de uma sessão comprometida.
--  4. Super Admin não exclui perfis de Super Admin pela API (evita lockout)
--  5. Evento de auditoria do bootstrap
--  6. Sequences para a Edge Function (service_role)
-- =============================================================================

-- 1. search_path fixo nas funções de gatilho -----------------------------------
alter function public.touch_updated_at()        set search_path = public;
alter function public.lock_establishment_id()   set search_path = public;
alter function public.protect_profile_fields()  set search_path = public;
alter function public.sync_price_from_variants() set search_path = public;

-- 2. Quem executa o quê ---------------------------------------------------------
-- Por padrão o Postgres concede EXECUTE a PUBLIC (inclui anon). Restringe:
revoke execute on function
  public.is_aal2(), public.is_super_admin(), public.my_establishment_id(),
  public.can_edit_establishment(uuid), public.can_write_media(text),
  public.admin_view_stats(integer), public.admin_accounts(), public.log_security_event(text)
  from public, anon;

-- usados dentro das políticas RLS (avaliadas com o papel de quem consulta)
grant execute on function
  public.is_aal2(), public.is_super_admin(), public.my_establishment_id(),
  public.can_edit_establishment(uuid), public.can_write_media(text)
  to authenticated, service_role;

-- RPCs do painel (cada uma valida papel + aal2 internamente)
grant execute on function public.admin_view_stats(integer), public.admin_accounts(), public.log_security_event(text)
  to authenticated;

-- funções de gatilho não são chamáveis pela API (o gatilho dispara sem esse privilégio)
revoke execute on function
  public.handle_new_user(), public.touch_updated_at(), public.lock_establishment_id(),
  public.protect_profile_fields(), public.sync_price_from_variants()
  from public, anon, authenticated;

-- API pública dos cardápios: continua aberta (leitura e contagem de visitas)
grant execute on function public.get_public_menu(text), public.register_menu_view(text, text) to anon, authenticated;

-- 3. Papel imutável pela API --------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  -- SQL Editor (sem JWT) e service_role passam; qualquer sessão de usuário é verificada
  if coalesce(auth.role(), '') = 'authenticated' then
    -- ninguém troca papel pela API, nem o Super Admin: promoção só via bootstrap_super_admin.sql
    if new.role is distinct from old.role or new.id is distinct from old.id or new.email is distinct from old.email then
      raise exception 'Alteração não permitida.' using errcode = '42501';
    end if;
    -- vínculo com estabelecimento: só o Super Admin (com aal2, via is_super_admin)
    if new.establishment_id is distinct from old.establishment_id and not public.is_super_admin() then
      raise exception 'Alteração não permitida.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

revoke execute on function public.protect_profile_fields() from public, anon, authenticated;

-- 4. Exclusão de perfis: só de donos de restaurante -----------------------------
drop policy if exists "profiles: admin delete" on public.profiles;
create policy "profiles: admin delete" on public.profiles
  for delete to authenticated using (public.is_super_admin() and role = 'owner');

-- 5. Auditoria do bootstrap --------------------------------------------------
alter table public.security_events drop constraint if exists security_events_event_check;
alter table public.security_events add constraint security_events_event_check check (event in (
  'mfa_enrolled', 'mfa_challenge_failed', 'mfa_verified',
  'mfa_reset_by_admin', 'mfa_reset_denied', 'super_admin_bootstrap'));

-- 6. Sequences usadas por inserções do servidor ---------------------------------
grant usage, select on all sequences in schema public to service_role;

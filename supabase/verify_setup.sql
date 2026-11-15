-- =============================================================================
-- Or7 Table — verificação da instalação (SOMENTE LEITURA)
-- Rode no SQL Editor depois da 0005 (e de novo depois do bootstrap).
-- Não altera nada: só consulta o catálogo do Postgres.
-- Resultado esperado: a coluna "ok" = true em todas as linhas
-- (exceto "super_admin_unico", que só fica true depois do bootstrap).
-- =============================================================================

with
tabelas(nome) as (
  values ('establishments'), ('establishment_billing'), ('profiles'), ('owner_invites'), ('categories'),
         ('products'), ('menu_views'), ('billing_payments'), ('security_events')
),
admin_tabelas(nome) as (
  values ('establishments'), ('establishment_billing'), ('profiles'), ('owner_invites'), ('categories'),
         ('products'), ('menu_views'), ('billing_payments')
),
checks(ordem, verificacao, ok, detalhe) as (
  select 1, 'tabelas_criadas',
         count(*) filter (where to_regclass('public.' || nome) is not null) = 9,
         count(*) filter (where to_regclass('public.' || nome) is not null) || ' de 9'
    from tabelas
  union all
  select 2, 'rls_ativa_em_todas',
         count(*) filter (where c.relrowsecurity) = 9,
         coalesce(string_agg(t.nome, ', ') filter (where not c.relrowsecurity), 'todas com RLS')
    from tabelas t join pg_class c on c.oid = to_regclass('public.' || t.nome)
  union all
  select 3, 'mfa_aal2_restritiva_nas_tabelas',
         count(*) = 8,
         count(*) || ' de 8 tabelas'
    from admin_tabelas t
   where exists (select 1 from pg_policies p
                  where p.schemaname = 'public' and p.tablename = t.nome
                    and p.policyname = 'mfa: exige aal2' and p.permissive = 'RESTRICTIVE')
  union all
  select 4, 'mfa_aal2_no_storage',
         exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                  and policyname = 'menu-media: exige aal2' and permissive = 'RESTRICTIVE'),
         'storage.objects'
  union all
  select 5, 'grants_explicitos_authenticated',
         has_table_privilege('authenticated', 'public.products', 'SELECT')
     and has_table_privilege('authenticated', 'public.billing_payments', 'INSERT')
     and has_table_privilege('authenticated', 'public.security_events', 'SELECT'),
         'products / billing_payments / security_events'
  union all
  select 6, 'anon_sem_acesso_direto_as_tabelas',
         not has_table_privilege('anon', 'public.products', 'SELECT')
     and not has_table_privilege('anon', 'public.profiles', 'SELECT')
     and not has_table_privilege('anon', 'public.billing_payments', 'SELECT'),
         'products / profiles / billing_payments'
  union all
  select 7, 'service_role_para_edge_function',
         has_table_privilege('service_role', 'public.profiles', 'UPDATE')
     and has_table_privilege('service_role', 'public.security_events', 'INSERT'),
         'profiles / security_events'
  union all
  select 8, 'cardapio_publico_aberto_ao_anon',
         has_function_privilege('anon', 'public.get_public_menu(text)', 'EXECUTE')
     and has_function_privilege('anon', 'public.register_menu_view(text,text)', 'EXECUTE'),
         'get_public_menu / register_menu_view'
  union all
  select 9, 'funcoes_admin_fechadas_ao_anon',
         not has_function_privilege('anon', 'public.is_super_admin()', 'EXECUTE')
     and not has_function_privilege('anon', 'public.admin_accounts()', 'EXECUTE')
     and not has_function_privilege('anon', 'public.log_security_event(text)', 'EXECUTE'),
         'is_super_admin / admin_accounts / log_security_event'
  union all
  select 10, 'is_super_admin_exige_aal2',
         pg_get_functiondef('public.is_super_admin()'::regprocedure) like '%is_aal2()%',
         'definição da função'
  union all
  select 11, 'papel_imutavel_pela_api_0005',
         pg_get_functiondef('public.protect_profile_fields()'::regprocedure) like '%promoção só via bootstrap%',
         'gatilho protect_profile_fields'
  union all
  select 12, 'gatilho_de_novos_usuarios',
         exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal),
         'auth.users → handle_new_user'
  union all
  select 13, 'bucket_menu_media',
         exists (select 1 from storage.buckets where id = 'menu-media' and public),
         'público para leitura das fotos'
  union all
  select 14, 'auditoria_aceita_bootstrap',
         exists (select 1 from pg_constraint where conname = 'security_events_event_check'
                  and pg_get_constraintdef(oid) like '%super_admin_bootstrap%'),
         'security_events_event_check'
  union all
  select 15, 'cardapio_inexistente_responde_vazio',
         public.get_public_menu('slug-que-nao-existe-or7') is null,
         'get_public_menu sem erro'
  union all
  select 16, 'super_admin_unico',
         (select count(*) from public.profiles where role = 'super_admin') = 1,
         (select count(*) from public.profiles where role = 'super_admin') || ' Super Admin(s) — esperado 0 antes do bootstrap, 1 depois'
)
select ordem, verificacao, ok, detalhe from checks order by ordem;

-- =============================================================================
-- Or7 Table — finalização: destaques, convites com validade, financeiro manual
-- Rode depois da 0001 e da 0002, no SQL Editor. Não apaga dados e pode ser
-- executado mais de uma vez.
--
--  1. products.is_featured ............ destaques escolhidos pelo restaurante
--  2. owner_invites.expires_at ........ convites valem 7 dias (reenvio renova)
--  3. establishment_billing ........... início do contrato e dia de vencimento
--  4. billing_payments ................ mensalidades RECEBIDAS (lançadas pela Or7)
--  5. admin_accounts() ................ contas + último acesso (só Super Admin)
--  6. get_public_menu() ............... passa a devolver is_featured
-- =============================================================================

-- 1. Destaques ----------------------------------------------------------------
alter table public.products
  add column if not exists is_featured boolean not null default false;

-- 2. Convites com validade ----------------------------------------------------
alter table public.owner_invites
  add column if not exists expires_at   timestamptz not null default (now() + interval '7 days'),
  add column if not exists last_sent_at timestamptz not null default now(),
  add column if not exists send_count   integer     not null default 1 check (send_count between 1 and 50);

-- Convite vencido não vincula mais ninguém ao estabelecimento.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv public.owner_invites%rowtype;
begin
  select * into inv from public.owner_invites
   where lower(email) = lower(new.email) and accepted_at is null and expires_at > now()
   order by created_at desc limit 1;

  insert into public.profiles (id, email, full_name, role, establishment_id)
  values (new.id, new.email, coalesce(inv.full_name, new.raw_user_meta_data->>'full_name'), 'owner', inv.establishment_id)
  on conflict (id) do nothing;

  if inv.id is not null then
    update public.owner_invites set accepted_at = now() where id = inv.id;
  end if;
  return new;
end $$;

-- 3. Contrato -----------------------------------------------------------------
alter table public.establishment_billing
  add column if not exists contract_start date,
  add column if not exists due_day smallint check (due_day between 1 and 28);

-- 4. Pagamentos recebidos (registro manual; nenhum gateway) -------------------
create table if not exists public.billing_payments (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  -- mês de competência, sempre no dia 1 (ex.: 2026-11-01)
  reference_month  date not null check (extract(day from reference_month) = 1),
  amount           numeric(10,2) not null check (amount > 0 and amount < 1000000),
  paid_at          date not null default current_date,
  method           text check (method in ('pix', 'boleto', 'transferencia', 'cartao', 'dinheiro', 'outro')),
  notes            text check (char_length(notes) <= 300),
  recorded_by      uuid references auth.users(id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now()
);
create index if not exists billing_payments_est_month_idx on public.billing_payments(establishment_id, reference_month desc);
create index if not exists billing_payments_month_idx on public.billing_payments(reference_month desc);

alter table public.billing_payments enable row level security;
revoke all on public.billing_payments from anon;
-- permissões explícitas (o Supabase não concede mais automaticamente); a RLS limita ao Super Admin
grant select, insert, update, delete on public.billing_payments to authenticated, service_role;

drop policy if exists "payments: admin all" on public.billing_payments;
create policy "payments: admin all" on public.billing_payments
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- 5. Contas para o painel do Super Admin --------------------------------------
-- Junta profiles com auth.users (convite enviado, e-mail confirmado, último acesso).
-- drop antes: a 0004 amplia o retorno desta função (rodar as migrações em ordem)
drop function if exists public.admin_accounts();
create or replace function public.admin_accounts()
returns table (
  id uuid, email text, full_name text, role text, establishment_id uuid, created_at timestamptz,
  invited_at timestamptz, confirmed_at timestamptz, last_sign_in_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito.' using errcode = '42501';
  end if;
  return query
    select p.id, p.email, p.full_name, p.role, p.establishment_id, p.created_at,
           u.invited_at, u.email_confirmed_at, u.last_sign_in_at
      from public.profiles p
      left join auth.users u on u.id = p.id
     order by p.created_at desc;
end $$;

revoke all on function public.admin_accounts() from public;
grant execute on function public.admin_accounts() to authenticated;

-- 6. API pública com destaques ------------------------------------------------
create or replace function public.get_public_menu(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'establishment', jsonb_build_object(
      'id', e.id, 'name', e.name, 'slug', e.slug, 'theme_key', e.theme_key,
      'external_url', e.external_url, 'tagline', e.tagline, 'address', e.address,
      'opening_hours', e.opening_hours, 'instagram', e.instagram, 'logo_path', e.logo_path,
      'updated_at', greatest(e.updated_at, (select max(p.updated_at) from public.products p where p.establishment_id = e.id))
    ),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'position', c.position)
                       order by c.position, c.created_at)
        from public.categories c where c.establishment_id = e.id), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'category_id', p.category_id, 'name', p.name,
               'description', p.description, 'price', p.price, 'variants', p.variants,
               'image_path', p.image_path, 'is_available', p.is_available,
               'is_featured', p.is_featured, 'position', p.position)
             order by p.position, p.created_at)
        from public.products p where p.establishment_id = e.id), '[]'::jsonb)
  )
  from public.establishments e
  where e.slug = lower(p_slug) and e.is_active;
$$;

revoke all on function public.get_public_menu(text) from public;
grant execute on function public.get_public_menu(text) to anon, authenticated;

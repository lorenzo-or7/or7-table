-- =============================================================================
-- Or7 Table — schema, segurança (RLS), storage e funções públicas
-- Execute uma vez no Supabase: Dashboard → SQL Editor → New query → Run.
-- O script é idempotente nas partes que podem ser repetidas com segurança.
--
-- Esta é a primeira de cinco migrações (0001 → 0005), que devem ser executadas EM ORDEM.
-- A ordem completa, as configurações do Dashboard e a criação do Super Admin
-- (supabase/bootstrap_super_admin.sql, depois da 0005) estão em PUBLICACAO.md.
-- Não promova o Super Admin com UPDATE manual: use o script de bootstrap.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------

create table if not exists public.establishments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  slug          text not null unique
                check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  is_active     boolean not null default true,
  -- Identidade React usada em /table/:slug (registrada em src/menus/registry.ts)
  theme_key     text not null default 'base',
  -- Endereço de um cardápio hospedado separadamente (opcional).
  -- Quando preenchido, /table/:slug registra a visita e redireciona para ele.
  external_url  text check (external_url is null or external_url ~ '^https://'),
  tagline       text check (char_length(tagline) <= 160),
  address       text check (char_length(address) <= 200),
  opening_hours text check (char_length(opening_hours) <= 200),
  instagram     text check (char_length(instagram) <= 60),
  logo_path     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Valores comerciais ficam fora de establishments para nunca vazarem
-- para proprietários ou para o público.
create table if not exists public.establishment_billing (
  establishment_id uuid primary key references public.establishments(id) on delete cascade,
  monthly_fee      numeric(10,2) not null default 0 check (monthly_fee >= 0),
  notes            text check (char_length(notes) <= 500),
  updated_at       timestamptz not null default now()
);

create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  full_name        text check (char_length(full_name) <= 120),
  role             text not null default 'owner' check (role in ('super_admin', 'owner')),
  establishment_id uuid references public.establishments(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists profiles_establishment_idx on public.profiles(establishment_id);

-- Convites pendentes: ligam um e-mail a um estabelecimento antes da conta existir.
create table if not exists public.owner_invites (
  id               uuid primary key default gen_random_uuid(),
  email            text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name        text check (char_length(full_name) <= 120),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  invited_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  accepted_at      timestamptz
);
create unique index if not exists owner_invites_pending_email_idx
  on public.owner_invites (lower(email)) where accepted_at is null;

create table if not exists public.categories (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 60),
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  unique (id, establishment_id)
);
create index if not exists categories_establishment_idx on public.categories(establishment_id, position);

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  category_id      uuid not null,
  name             text not null check (char_length(name) between 1 and 80),
  description      text check (char_length(description) <= 400),
  price            numeric(10,2) not null check (price >= 0 and price < 100000),
  image_path       text,
  is_available     boolean not null default true,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- garante que a categoria pertence ao mesmo estabelecimento do produto;
  -- impede excluir categoria que ainda tem produtos (a interface trata antes)
  foreign key (category_id, establishment_id)
    references public.categories(id, establishment_id) on delete no action
);
create index if not exists products_establishment_idx on public.products(establishment_id, category_id, position);

-- Visualizações anônimas: sem IP, sem cookie, sem dado pessoal.
create table if not exists public.menu_views (
  id               bigint generated always as identity primary key,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  source           text not null default 'link' check (source in ('qr', 'link')),
  viewed_at        timestamptz not null default now()
);
create index if not exists menu_views_establishment_time_idx on public.menu_views(establishment_id, viewed_at desc);
create index if not exists menu_views_time_idx on public.menu_views(viewed_at desc);

-- -----------------------------------------------------------------------------
-- Funções auxiliares (security definer evita recursão nas políticas)
-- -----------------------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function public.my_establishment_id()
returns uuid language sql stable security definer set search_path = public as $$
  select establishment_id from public.profiles where id = auth.uid() and role = 'owner';
$$;

create or replace function public.can_edit_establishment(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or (target is not null and target = public.my_establishment_id());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists establishments_touch on public.establishments;
create trigger establishments_touch before update on public.establishments
  for each row execute function public.touch_updated_at();
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists billing_touch on public.establishment_billing;
create trigger billing_touch before update on public.establishment_billing
  for each row execute function public.touch_updated_at();

-- Proprietário não troca o produto/categoria de estabelecimento.
create or replace function public.lock_establishment_id()
returns trigger language plpgsql as $$
begin
  if new.establishment_id is distinct from old.establishment_id
     and coalesce(auth.role(), '') = 'authenticated' and not public.is_super_admin() then
    raise exception 'Não é permitido mover itens entre estabelecimentos.';
  end if;
  return new;
end $$;

drop trigger if exists products_lock_establishment on public.products;
create trigger products_lock_establishment before update on public.products
  for each row execute function public.lock_establishment_id();
drop trigger if exists categories_lock_establishment on public.categories;
create trigger categories_lock_establishment before update on public.categories
  for each row execute function public.lock_establishment_id();

-- Usuário comum pode editar o próprio nome, mas nunca papel, e-mail ou vínculo.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $$
begin
  -- SQL Editor e service_role (sem JWT de usuário) podem promover o Super Admin
  if coalesce(auth.role(), '') = 'authenticated' and not public.is_super_admin() then
    if new.role is distinct from old.role
       or new.establishment_id is distinct from old.establishment_id
       or new.email is distinct from old.email
       or new.id is distinct from old.id then
      raise exception 'Alteração não permitida.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Toda conta nova ganha um perfil de proprietário sem acesso,
-- a menos que exista um convite pendente para o e-mail.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv public.owner_invites%rowtype;
begin
  select * into inv from public.owner_invites
   where lower(email) = lower(new.email) and accepted_at is null
   order by created_at desc limit 1;

  insert into public.profiles (id, email, full_name, role, establishment_id)
  values (new.id, new.email, coalesce(inv.full_name, new.raw_user_meta_data->>'full_name'), 'owner', inv.establishment_id)
  on conflict (id) do nothing;

  if inv.id is not null then
    update public.owner_invites set accepted_at = now() where id = inv.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.establishments         enable row level security;
alter table public.establishment_billing  enable row level security;
alter table public.profiles               enable row level security;
alter table public.owner_invites          enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.menu_views             enable row level security;

-- O público (anon) não lê tabelas diretamente: usa get_public_menu().
revoke all on public.establishments, public.establishment_billing, public.profiles,
              public.owner_invites, public.categories, public.products, public.menu_views from anon;

-- Permissões explícitas. Desde 30/10/2026 o Supabase não concede mais acesso automático
-- a tabelas novas do schema public: sem estes GRANTs o banco recusa a consulta antes da RLS.
-- A RLS (abaixo) continua decidindo QUAIS linhas cada usuário vê ou altera.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.establishments, public.establishment_billing,
      public.owner_invites, public.categories, public.products to authenticated;
grant select, update, delete on public.profiles to authenticated;   -- perfis nascem só pelo gatilho
grant select, delete on public.menu_views to authenticated;           -- gravação só por register_menu_view
grant select, insert, update, delete on public.establishments, public.establishment_billing,
      public.profiles, public.owner_invites, public.categories, public.products,
      public.menu_views to service_role;                              -- Edge Function (servidor)

-- establishments
drop policy if exists "establishments: admin all" on public.establishments;
create policy "establishments: admin all" on public.establishments
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists "establishments: owner reads own" on public.establishments;
create policy "establishments: owner reads own" on public.establishments
  for select to authenticated using (id = public.my_establishment_id());

-- establishment_billing (somente Super Admin)
drop policy if exists "billing: admin all" on public.establishment_billing;
create policy "billing: admin all" on public.establishment_billing
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- profiles
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_super_admin());
drop policy if exists "profiles: update own name or admin" on public.profiles;
create policy "profiles: update own name or admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());
drop policy if exists "profiles: admin delete" on public.profiles;
create policy "profiles: admin delete" on public.profiles
  for delete to authenticated using (public.is_super_admin());

-- owner_invites (somente Super Admin)
drop policy if exists "invites: admin all" on public.owner_invites;
create policy "invites: admin all" on public.owner_invites
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- categories
drop policy if exists "categories: editors read" on public.categories;
create policy "categories: editors read" on public.categories
  for select to authenticated using (public.can_edit_establishment(establishment_id));
drop policy if exists "categories: editors insert" on public.categories;
create policy "categories: editors insert" on public.categories
  for insert to authenticated with check (public.can_edit_establishment(establishment_id));
drop policy if exists "categories: editors update" on public.categories;
create policy "categories: editors update" on public.categories
  for update to authenticated using (public.can_edit_establishment(establishment_id))
  with check (public.can_edit_establishment(establishment_id));
drop policy if exists "categories: editors delete" on public.categories;
create policy "categories: editors delete" on public.categories
  for delete to authenticated using (public.can_edit_establishment(establishment_id));

-- products
drop policy if exists "products: editors read" on public.products;
create policy "products: editors read" on public.products
  for select to authenticated using (public.can_edit_establishment(establishment_id));
drop policy if exists "products: editors insert" on public.products;
create policy "products: editors insert" on public.products
  for insert to authenticated with check (public.can_edit_establishment(establishment_id));
drop policy if exists "products: editors update" on public.products;
create policy "products: editors update" on public.products
  for update to authenticated using (public.can_edit_establishment(establishment_id))
  with check (public.can_edit_establishment(establishment_id));
drop policy if exists "products: editors delete" on public.products;
create policy "products: editors delete" on public.products
  for delete to authenticated using (public.can_edit_establishment(establishment_id));

-- menu_views: leitura só do Super Admin; gravação só pela função register_menu_view
drop policy if exists "menu_views: admin read" on public.menu_views;
create policy "menu_views: admin read" on public.menu_views
  for select to authenticated using (public.is_super_admin());
drop policy if exists "menu_views: admin delete" on public.menu_views;
create policy "menu_views: admin delete" on public.menu_views
  for delete to authenticated using (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- API pública (chave anon) — usada pelo Or7 Table e por cardápios hospedados à parte
-- -----------------------------------------------------------------------------

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
               'description', p.description, 'price', p.price, 'image_path', p.image_path,
               'is_available', p.is_available, 'position', p.position)
             order by p.position, p.created_at)
        from public.products p where p.establishment_id = e.id), '[]'::jsonb)
  )
  from public.establishments e
  where e.slug = lower(p_slug) and e.is_active;
$$;

create or replace function public.register_menu_view(p_slug text, p_source text default 'link')
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  target uuid;
begin
  select id into target from public.establishments where slug = lower(p_slug) and is_active;
  if target is null then return; end if;
  insert into public.menu_views (establishment_id, source)
  values (target, case when p_source = 'qr' then 'qr' else 'link' end);
end $$;

-- Agregado para o Analytics do Super Admin
create or replace function public.admin_view_stats(p_days integer default 30)
returns table (day date, establishment_id uuid, source text, views bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito.' using errcode = '42501';
  end if;
  return query
    select (v.viewed_at at time zone 'America/Sao_Paulo')::date as day,
           v.establishment_id, v.source, count(*)::bigint
      from public.menu_views v
     where v.viewed_at >= now() - make_interval(days => greatest(1, least(p_days, 366)))
     group by 1, 2, 3
     order by 1;
end $$;

revoke all on function public.get_public_menu(text) from public;
revoke all on function public.register_menu_view(text, text) from public;
revoke all on function public.admin_view_stats(integer) from public;
grant execute on function public.get_public_menu(text) to anon, authenticated;
grant execute on function public.register_menu_view(text, text) to anon, authenticated;
grant execute on function public.admin_view_stats(integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: fotografias e logos
-- Estrutura: menu-media/{establishment_id}/products/{arquivo}
--            menu-media/{establishment_id}/brand/{arquivo}   (somente Super Admin)
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-media', 'menu-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_write_media(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin()
      or (
        (storage.foldername(object_name))[1] = public.my_establishment_id()::text
        and (storage.foldername(object_name))[2] = 'products'
      );
$$;

drop policy if exists "menu-media: editors read" on storage.objects;
create policy "menu-media: editors read" on storage.objects
  for select to authenticated using (bucket_id = 'menu-media' and public.can_write_media(name));
drop policy if exists "menu-media: editors insert" on storage.objects;
create policy "menu-media: editors insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-media' and public.can_write_media(name));
drop policy if exists "menu-media: editors update" on storage.objects;
create policy "menu-media: editors update" on storage.objects
  for update to authenticated using (bucket_id = 'menu-media' and public.can_write_media(name))
  with check (bucket_id = 'menu-media' and public.can_write_media(name));
drop policy if exists "menu-media: editors delete" on storage.objects;
create policy "menu-media: editors delete" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-media' and public.can_write_media(name));

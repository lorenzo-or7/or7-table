-- =============================================================================
-- Or7 Table — preços por tamanho (variantes)
-- Rode depois da 0001, no SQL Editor. Pode ser executado mais de uma vez.
--
-- Produtos comuns continuam iguais (variants = null, vale a coluna price).
-- Bebidas com tamanhos guardam a lista em variants, por exemplo:
--   [{"label":"Tall","volume_ml":300,"price":15.90}, {"label":"Grande", ...}]
-- A coluna price passa a refletir o menor preço da lista ("a partir de").
-- As políticas RLS de products continuam valendo: a coluna segue as mesmas regras.
-- =============================================================================

alter table public.products
  add column if not exists variants jsonb;

alter table public.products drop constraint if exists products_variants_shape;
alter table public.products add constraint products_variants_shape check (
  variants is null
  or (
    jsonb_typeof(variants) = 'array'
    and jsonb_array_length(variants) between 1 and 6
    and not jsonb_path_exists(
      variants,
      '$[*] ? (@.label.type() != "string" || @.price.type() != "number" || @.price < 0 || @.price >= 100000)'
    )
  )
);

-- Mantém price = menor preço das variantes, para listagens e cardápios antigos.
create or replace function public.sync_price_from_variants()
returns trigger language plpgsql as $$
begin
  if new.variants is not null and jsonb_array_length(new.variants) > 0 then
    new.price := (select min((v ->> 'price')::numeric) from jsonb_array_elements(new.variants) v);
  end if;
  return new;
end $$;

drop trigger if exists products_sync_price on public.products;
create trigger products_sync_price before insert or update on public.products
  for each row execute function public.sync_price_from_variants();

-- API pública: inclui as variantes (somente leitura, mesmos dados públicos de antes).
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
               'image_path', p.image_path, 'is_available', p.is_available, 'position', p.position)
             order by p.position, p.created_at)
        from public.products p where p.establishment_id = e.id), '[]'::jsonb)
  )
  from public.establishments e
  where e.slug = lower(p_slug) and e.is_active;
$$;

revoke all on function public.get_public_menu(text) from public;
grant execute on function public.get_public_menu(text) to anon, authenticated;

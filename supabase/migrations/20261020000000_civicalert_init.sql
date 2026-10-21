-- CivicAlert initial schema (Supabase / PostgreSQL)

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null unique check (email = lower(email)),
  role text not null default 'resident' check (role in ('resident','power_admin','water_admin')),
  utility text check (utility in ('power','water')),
  phone_number text not null check (char_length(phone_number) between 7 and 20),
  address_line text not null check (char_length(address_line) between 3 and 240),
  barangay text not null check (char_length(barangay) between 2 and 100),
  purok text not null check (char_length(purok) between 1 and 100),
  city text not null default 'Cagayan de Oro City',
  postal_code text not null default '',
  sms_alerts boolean not null default true,
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_role_utility_consistency check (
    (role = 'power_admin' and utility = 'power') or
    (role = 'water_admin' and utility = 'water') or
    (role = 'resident' and utility is null)
  )
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table if not exists public.terms_acceptances (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  terms_version text not null,
  terms_title text not null default 'CivicAlert Resident Terms and Conditions',
  accepted_at timestamptz not null default now(),
  user_agent text,
  unique (profile_id, terms_version)
);

create sequence if not exists public.announcement_reference_seq start 1;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  utility text not null check (utility in ('power','water')),
  title text not null check (char_length(title) between 3 and 160),
  message text not null check (char_length(message) between 3 and 4000),
  image_url text check (image_url is null or image_url ~* '^https?://'),
  barangays text[] not null check (coalesce(array_length(barangays, 1), 0) >= 1),
  puroks text[] not null check (coalesce(array_length(puroks, 1), 0) >= 1),
  status text not null default 'draft' check (status in ('draft','published','updated','archived')),
  recipient_count integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists announcements_utility_status_idx on public.announcements (utility, status);
create index if not exists announcements_barangays_gin on public.announcements using gin (barangays);
create index if not exists announcements_puroks_gin on public.announcements using gin (puroks);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

create table if not exists public.notification_records (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  utility text not null check (utility in ('power','water')),
  channel text not null check (channel in ('sms','email','facebook','instagram')),
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  recipient_name text,
  destination text not null,
  content_text text not null,
  has_image boolean not null default false,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  provider text not null default '',
  provider_ref text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_records_announcement_idx on public.notification_records (announcement_id);
create index if not exists notification_records_status_idx on public.notification_records (status);
create index if not exists notification_records_utility_idx on public.notification_records (utility);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  utility text check (utility in ('power','water') or utility is null),
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_utility_idx on public.activity_logs (utility);
create index if not exists activity_logs_actor_idx on public.activity_logs (actor_id);

create table if not exists public.social_accounts (
  utility text primary key check (utility in ('power','water')),
  facebook_page_name text not null,
  instagram_handle text not null
);

insert into public.social_accounts (utility, facebook_page_name, instagram_handle)
values
  ('power','CEPALCO Official','@cepalco'),
  ('water','Cagayan de Oro Water District Official','@cowd.official')
on conflict (utility) do nothing;
-- helper functions
create or replace function public.current_profile_role()
returns text language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;
create or replace function public.current_admin_utility()
returns text language sql security definer stable set search_path = public as $$
  select utility from public.profiles where id = auth.uid() and role in ('power_admin','water_admin');
$$;
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('power_admin','water_admin'));
$$;

-- auth trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text := coalesce(meta->>'role', 'resident');
  v_utility text := nullif(meta->>'utility', '');
  v_terms_version text := meta->>'terms_version';
begin
  if v_role not in ('resident','power_admin','water_admin') then v_role := 'resident'; end if;
  if v_role = 'resident' then v_utility := null;
  elsif v_role = 'power_admin' then v_utility := 'power';
  elsif v_role = 'water_admin' then v_utility := 'water'; end if;
  insert into public.profiles (id, full_name, email, role, utility, phone_number, address_line, barangay, purok, city, postal_code, sms_alerts, profile_image_url)
  values (new.id, coalesce(nullif(meta->>'full_name',''), split_part(new.email,'@',1)), lower(new.email), v_role, v_utility,
    coalesce(nullif(meta->>'phone_number',''), '0000000'), coalesce(nullif(meta->>'address_line',''), 'Not provided'),
    coalesce(nullif(meta->>'barangay',''), 'Unknown'), coalesce(nullif(meta->>'purok',''), 'Unknown'),
    coalesce(nullif(meta->>'city',''), 'Cagayan de Oro City'), coalesce(meta->>'postal_code', ''),
    coalesce((meta->>'sms_alerts')::boolean, true), nullif(meta->>'profile_image_url',''))
  on conflict (id) do nothing;
  if v_terms_version is not null and v_terms_version <> '' and v_role = 'resident' then
    insert into public.terms_acceptances (profile_id, terms_version, terms_title, user_agent)
    values (new.id, v_terms_version, coalesce(nullif(meta->>'terms_title',''), 'CivicAlert Resident Terms and Conditions'), nullif(meta->>'user_agent',''))
    on conflict (profile_id, terms_version) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- announcement reference trigger
create or replace function public.set_announcement_reference()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'CA-' || case new.utility when 'power' then 'CE' else 'WD' end || '-' || lpad(nextval('public.announcement_reference_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;
create trigger announcements_set_reference before insert on public.announcements for each row execute function public.set_announcement_reference();

-- announcement change trigger
create or replace function public.handle_announcement_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_name text; v_actor_role text; v_utility text := coalesce(new.utility, old.utility);
begin
  select full_name, role into v_actor_name, v_actor_role from public.profiles where id = auth.uid();
  if tg_op = 'INSERT' then
    insert into public.activity_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, utility, summary)
    values (auth.uid(), v_actor_name, v_actor_role, 'created', 'announcement', new.id::text, v_utility, 'Created announcement ' || new.reference || ' (' || new.status || ')');
  elsif tg_op = 'UPDATE' then
    insert into public.activity_logs (actor_id, actor_name, actor_role, action, entity_type, entity_id, utility, summary)
    values (auth.uid(), v_actor_name, v_actor_role, case when new.status <> old.status then 'status_changed' else 'updated' end, 'announcement', new.id::text, v_utility, 'Updated announcement ' || new.reference || ' -> ' || new.status);
    if new.status in ('published','updated') and old.status is distinct from new.status then
      insert into public.notification_records (announcement_id, utility, channel, recipient_profile_id, recipient_name, destination, content_text, has_image, status)
      select new.id, new.utility, ch.channel, p.id, p.full_name,
        case ch.channel when 'sms' then p.phone_number when 'email' then p.email else p.full_name end,
        'CivicAlert ' || case new.utility when 'power' then 'CEPALCO' else 'Water District' end || ': ' || new.title || E'\n' || new.message,
        (new.image_url is not null), 'queued'
      from public.profiles p
      cross join (values ('sms'),('email'),('facebook'),('instagram')) as ch(channel)
      where p.role = 'resident' and p.barangay = any(new.barangays) and p.purok = any(new.puroks)
        and (ch.channel <> 'sms' or p.sms_alerts = true);
      update public.announcements set recipient_count = (select count(distinct recipient_profile_id) from public.notification_records where announcement_id = new.id) where id = new.id;
    end if;
  end if;
  return new;
end;
$$;
create trigger announcements_audit after insert or update on public.announcements for each row execute function public.handle_announcement_change();

-- RPC
create or replace function public.estimate_recipients(p_barangays text[], p_puroks text[])
returns integer language sql security definer stable set search_path = public as $$
  select count(*)::integer from public.profiles where role = 'resident' and barangay = any(p_barangays) and purok = any(p_puroks);
$$;

-- profile immutability
create or replace function public.enforce_profile_update_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then raise exception 'role cannot be changed'; end if;
  if new.utility is distinct from old.utility then raise exception 'utility cannot be changed'; end if;
  if new.email is distinct from old.email then raise exception 'email cannot be changed'; end if;
  if new.id is distinct from old.id then raise exception 'id cannot be changed'; end if;
  return new;
end;
$$;
create trigger profiles_enforce_update_rules before update on public.profiles for each row execute function public.enforce_profile_update_rules();

-- RLS
alter table public.profiles enable row level security;
alter table public.terms_acceptances enable row level security;
alter table public.announcements enable row level security;
alter table public.notification_records enable row level security;
alter table public.activity_logs enable row level security;
alter table public.social_accounts enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "terms_select_own_or_admin" on public.terms_acceptances for select to authenticated using (profile_id = auth.uid() or public.is_admin());
create policy "terms_insert_own" on public.terms_acceptances for insert to authenticated with check (profile_id = auth.uid());

create policy "announcements_select" on public.announcements for select to authenticated using (case when public.is_admin() then utility = public.current_admin_utility() else status in ('published','updated') end);
create policy "announcements_insert_admin" on public.announcements for insert to authenticated with check (public.is_admin() and utility = public.current_admin_utility() and created_by = auth.uid());
create policy "announcements_update_admin" on public.announcements for update to authenticated using (public.is_admin() and utility = public.current_admin_utility()) with check (public.is_admin() and utility = public.current_admin_utility());

create policy "notification_records_select" on public.notification_records for select to authenticated using (case when public.is_admin() then utility = public.current_admin_utility() else recipient_profile_id = auth.uid() end);

create policy "activity_logs_select" on public.activity_logs for select to authenticated using (case when public.is_admin() then (utility = public.current_admin_utility() or utility is null) else true end);

create policy "social_accounts_select" on public.social_accounts for select to authenticated using (true);

-- realtime
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.notification_records;

-- storage
insert into storage.buckets (id, name, public) values ('announcement-images','announcement-images', true) on conflict (id) do nothing;
create policy "announcement_images_public_read" on storage.objects for select to public using (bucket_id = 'announcement-images');
create policy "announcement_images_admin_write" on storage.objects for insert to authenticated with check (bucket_id = 'announcement-images' and public.is_admin());


-- Gestionale Artigiano PWA — schema iniziale Supabase
-- Eseguire una sola volta nel SQL Editor del progetto Supabase.
-- Tabelle protette da RLS: gli utenti autenticati vedono solo i propri record.
-- Non inserisce dati demo e non contiene segreti/service_role.

begin;

-- 1) Profilo dell'utente autenticato
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  company_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Clienti
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'Privato' check (kind in ('Privato', 'Azienda', 'Condominio', 'Altro')),
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id)
);

-- 3) Interventi / agenda
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  title text not null,
  type text not null default 'Elettrico' check (type in ('Elettrico', 'Idraulico', 'Clima', 'Fotovoltaico', 'Allarme', 'Videosorveglianza', 'Altro')),
  job_date date not null,
  start_time time not null,
  end_time time not null,
  address text not null default '',
  status text not null default 'Pianificato' check (status in ('Pianificato', 'In corso', 'Completato', 'Annullato')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint jobs_valid_time_range check (end_time > start_time),
  constraint jobs_client_same_owner_fk foreign key (owner_id, client_id)
    references public.clients(owner_id, id) on delete restrict
);

-- 4) Scadenze, certificazioni e manutenzioni
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  job_id uuid,
  title text not null,
  due_date date not null,
  status text not null default 'Prossima' check (status in ('Scaduta', 'Urgente', 'Prossima', 'Completata')),
  kind text not null default 'Manutenzione',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint deadlines_client_same_owner_fk foreign key (owner_id, client_id)
    references public.clients(owner_id, id) on delete restrict,
  constraint deadlines_job_same_owner_fk foreign key (owner_id, job_id)
    references public.jobs(owner_id, id) on delete restrict
);

-- 5) Cantieri
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  title text not null,
  address text not null default '',
  state text not null default 'Pianificato' check (state in ('Pianificato', 'In corso', 'Completato', 'Sospeso')),
  start_date date,
  end_date date,
  responsible text not null default '',
  description text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint sites_valid_date_range check (start_date is null or end_date is null or end_date >= start_date),
  constraint sites_client_same_owner_fk foreign key (owner_id, client_id)
    references public.clients(owner_id, id) on delete restrict
);

-- 6) Fatture
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null,
  site_id uuid,
  invoice_number text,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'Bozza' check (status in ('Bozza', 'Inviata', 'Pagata', 'Scaduta', 'Annullata')),
  currency char(3) not null default 'EUR',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_rate numeric(5,2) not null default 22 check (tax_rate >= 0 and tax_rate <= 100),
  total numeric(12,2) generated always as (round(subtotal * (1 + tax_rate / 100), 2)) stored,
  notes text not null default '',
  document_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint invoices_client_same_owner_fk foreign key (owner_id, client_id)
    references public.clients(owner_id, id) on delete restrict,
  constraint invoices_site_same_owner_fk foreign key (owner_id, site_id)
    references public.sites(owner_id, id) on delete restrict,
  constraint invoices_unique_number_per_owner unique (owner_id, invoice_number)
);

-- 7) Magazzino / materiali
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  sku text not null default '',
  category text not null default '',
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  unit text not null default 'pz',
  minimum_quantity numeric(12,3) not null default 0 check (minimum_quantity >= 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id)
);

-- 8) Impostazioni per utente
create table if not exists public.settings (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  biometric boolean not null default false,
  automatic_lock_minutes integer not null default 5 check (automatic_lock_minutes between 0 and 1440),
  deadline_notifications boolean not null default true,
  new_job_notifications boolean not null default true,
  site_updates boolean not null default true,
  work_start time not null default '08:00',
  work_end time not null default '18:00',
  working_days text[] not null default array['Lun','Mar','Mer','Gio','Ven','Sab']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_valid_work_hours check (work_end > work_start)
);

-- 9) Metadati documenti allegati ai cantieri. I file fisici vanno nel bucket privato.
create table if not exists public.site_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site_id uuid not null,
  title text not null,
  storage_path text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint site_documents_site_same_owner_fk foreign key (owner_id, site_id)
    references public.sites(owner_id, id) on delete cascade,
  constraint site_documents_unique_path unique (storage_path)
);

-- 10) Trigger updated_at condiviso
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at before update on public.clients
for each row execute function public.set_updated_at();
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs
for each row execute function public.set_updated_at();
drop trigger if exists deadlines_set_updated_at on public.deadlines;
create trigger deadlines_set_updated_at before update on public.deadlines
for each row execute function public.set_updated_at();
drop trigger if exists sites_set_updated_at on public.sites;
create trigger sites_set_updated_at before update on public.sites
for each row execute function public.set_updated_at();
drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices
for each row execute function public.set_updated_at();
drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at before update on public.inventory_items
for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
for each row execute function public.set_updated_at();

-- Crea automaticamente il profilo quando un utente viene registrato con Supabase Auth.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'company_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Allinea anche eventuali utenti Auth già esistenti prima di questa migrazione.
insert into public.profiles (id, full_name, company_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'company_name', '')
from auth.users as u
on conflict (id) do nothing;

-- 11) Indici per le schermate di agenda, scadenze e liste
create index if not exists clients_owner_name_idx on public.clients (owner_id, name);
create index if not exists jobs_owner_date_start_idx on public.jobs (owner_id, job_date, start_time);
create index if not exists jobs_owner_client_idx on public.jobs (owner_id, client_id);
create index if not exists deadlines_owner_due_date_idx on public.deadlines (owner_id, due_date);
create index if not exists deadlines_owner_status_idx on public.deadlines (owner_id, status);
create index if not exists sites_owner_state_idx on public.sites (owner_id, state);
create index if not exists invoices_owner_issue_date_idx on public.invoices (owner_id, issue_date desc);
create index if not exists inventory_owner_name_idx on public.inventory_items (owner_id, name);
create unique index if not exists inventory_owner_sku_unique_idx on public.inventory_items (owner_id, sku) where sku <> ''; 
create index if not exists site_documents_owner_site_idx on public.site_documents (owner_id, site_id);

-- 12) RLS: nega l'accesso incrociato tra utenti su tutte le tabelle applicative
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.jobs enable row level security;
alter table public.deadlines enable row level security;
alter table public.sites enable row level security;
alter table public.invoices enable row level security;
alter table public.inventory_items enable row level security;
alter table public.settings enable row level security;
alter table public.site_documents enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Le policy sono ricreate in modo deterministico; tutte le operazioni richiedono owner_id = utente autenticato.
drop policy if exists "clients_owner_only" on public.clients;
create policy "clients_owner_only" on public.clients for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "jobs_owner_only" on public.jobs;
create policy "jobs_owner_only" on public.jobs for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "deadlines_owner_only" on public.deadlines;
create policy "deadlines_owner_only" on public.deadlines for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "sites_owner_only" on public.sites;
create policy "sites_owner_only" on public.sites for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "invoices_owner_only" on public.invoices;
create policy "invoices_owner_only" on public.invoices for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "inventory_items_owner_only" on public.inventory_items;
create policy "inventory_items_owner_only" on public.inventory_items for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "settings_owner_only" on public.settings;
create policy "settings_owner_only" on public.settings for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "site_documents_owner_only" on public.site_documents;
create policy "site_documents_owner_only" on public.site_documents for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Permessi minimi per l'app: non concedere anon né privilegi di amministrazione/truncate.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert, update, delete on public.deadlines to authenticated;
grant select, insert, update, delete on public.sites to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.site_documents to authenticated;

-- 13) Bucket privato per documenti allegati (path: <USER_UUID>/<SITE_UUID>/<nome-file>)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-documents',
  'site-documents',
  false,
  20971520,
  array['application/pdf','image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_documents_storage_select_own" on storage.objects;
create policy "site_documents_storage_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'site-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "site_documents_storage_insert_own" on storage.objects;
create policy "site_documents_storage_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'site-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "site_documents_storage_update_own" on storage.objects;
create policy "site_documents_storage_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'site-documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'site-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "site_documents_storage_delete_own" on storage.objects;
create policy "site_documents_storage_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'site-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;

-- Dopo l'esecuzione:
-- 1) abilita/configura Supabase Auth (email/password o provider scelto).
-- 2) per le query applicative usa una sessione autenticata; anon non ha accesso alle tabelle.
-- 3) la PWA deve ancora essere collegata a Supabase Auth e sostituire LocalStorageRepository
--    con un repository remoto: creare queste tabelle da sole non attiva la sincronizzazione.

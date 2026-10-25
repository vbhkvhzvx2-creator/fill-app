-- P1: rendi espliciti alcuni collegamenti che esistevano solo in parte.
-- Applicare DOPO lo schema iniziale. Prima eseguire su staging; non usare sui dati reali senza backup.
begin;

-- Fail fast: correggere manualmente i record incoerenti invece di indovinare il cliente corretto.
do $$
begin
  if exists (
    select 1
    from public.invoices i
    join public.sites s on s.id = i.site_id
    where i.site_id is not null
      and (i.owner_id <> s.owner_id or i.client_id <> s.client_id)
  ) then
    raise exception 'Migrazione interrotta: esistono fatture collegate a un cantiere di un cliente diverso. Correggere i dati prima di riprovare.';
  end if;

  if exists (
    select 1
    from public.deadlines d
    join public.jobs j on j.id = d.job_id
    where d.job_id is not null
      and (d.owner_id <> j.owner_id or d.client_id <> j.client_id)
  ) then
    raise exception 'Migrazione interrotta: esistono scadenze collegate a un intervento di un cliente diverso. Correggere i dati prima di riprovare.';
  end if;
end;
$$;

-- Le FK composte richiedono una chiave unica che includa proprietario, cliente e ID.
create unique index if not exists sites_owner_client_id_unique_idx
  on public.sites (owner_id, client_id, id);

create unique index if not exists jobs_owner_client_id_unique_idx
  on public.jobs (owner_id, client_id, id);

-- Collega ogni intervento a un cantiere in modo esplicito.
-- NULL significa intervento indipendente dal cantiere; non lo deduciamo dal solo client_id.
alter table public.jobs
  add column if not exists site_id uuid;

create index if not exists jobs_owner_site_date_idx
  on public.jobs (owner_id, site_id, job_date, start_time);

alter table public.jobs
  drop constraint if exists jobs_site_same_client_fk;

alter table public.jobs
  add constraint jobs_site_same_client_fk
  foreign key (owner_id, client_id, site_id)
  references public.sites (owner_id, client_id, id)
  on delete restrict;

-- Una scadenza collegata a un intervento deve appartenere allo stesso cliente.
alter table public.deadlines
  drop constraint if exists deadlines_job_same_owner_fk;

alter table public.deadlines
  drop constraint if exists deadlines_job_same_client_fk;

alter table public.deadlines
  add constraint deadlines_job_same_client_fk
  foreign key (owner_id, client_id, job_id)
  references public.jobs (owner_id, client_id, id)
  on delete restrict;

-- La fattura non può riferirsi al cantiere di un altro cliente della stessa azienda.
alter table public.invoices
  drop constraint if exists invoices_site_same_owner_fk;

alter table public.invoices
  drop constraint if exists invoices_site_same_client_fk;

alter table public.invoices
  add constraint invoices_site_same_client_fk
  foreign key (owner_id, client_id, site_id)
  references public.sites (owner_id, client_id, id)
  on delete restrict;

commit;

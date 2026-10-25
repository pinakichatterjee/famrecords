create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

alter table public.profiles add column approved boolean not null default false;

create or replace function public.is_approved(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select approved from public.profiles where id = _user_id), false)
$$;

create policy "admins read all profiles" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "admins update profiles" on public.profiles
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy "own members" on public.family_members;
create policy "approved own members" on public.family_members
  for all to authenticated
  using (auth.uid() = user_id and public.is_approved(auth.uid()))
  with check (auth.uid() = user_id and public.is_approved(auth.uid()));

drop policy "own records" on public.medical_records;
create policy "approved own records" on public.medical_records
  for all to authenticated
  using (auth.uid() = created_by and public.is_approved(auth.uid()))
  with check (auth.uid() = created_by and public.is_approved(auth.uid()));
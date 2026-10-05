create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null check (role in ('global_admin', 'admin', 'teacher')),
  requested_role text not null check (requested_role in ('global_admin', 'admin', 'teacher')),
  primary_branch text not null check (primary_branch in ('Shelter Okota', 'Community Church', 'Anthony Church')),
  authorized_branches text[] not null default '{}',
  status text not null check (status in ('pending', 'approved', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Approved admins can read all profiles" on public.profiles;
create policy "Approved admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles actor
      where actor.id = auth.uid()
        and actor.status = 'approved'
        and actor.role in ('admin', 'global_admin')
    )
  );

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  has_admin boolean;
  requested_role text;
  branch text;
begin
  select exists (
    select 1 from public.profiles
    where status = 'approved' and role in ('admin', 'global_admin')
  ) into has_admin;

  requested_role := coalesce(new.raw_user_meta_data ->> 'requested_role', 'teacher');
  branch := coalesce(new.raw_user_meta_data ->> 'primary_branch', 'Shelter Okota');

  insert into public.profiles (
    id, full_name, email, phone, role, requested_role,
    primary_branch, authorized_branches, status, approved_at
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    lower(new.email),
    new.raw_user_meta_data ->> 'phone',
    case when not has_admin then 'global_admin' else requested_role end,
    requested_role,
    branch,
    case when not has_admin then array['Shelter Okota', 'Community Church', 'Anthony Church'] else array[branch] end,
    case when not has_admin then 'approved' else 'pending' end,
    case when not has_admin then now() else null end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer set search_path = public
as $$
declare
  auth_user auth.users%rowtype;
  existing_profile public.profiles;
  has_admin boolean;
  requested_role text;
  branch text;
begin
  select * into auth_user from auth.users where id = auth.uid();
  if auth_user.id is null then
    raise exception 'Not authenticated';
  end if;

  select * into existing_profile from public.profiles where id = auth_user.id;
  if existing_profile.id is not null then
    return existing_profile;
  end if;

  select exists (
    select 1 from public.profiles
    where status = 'approved' and role in ('admin', 'global_admin')
  ) into has_admin;

  requested_role := coalesce(auth_user.raw_user_meta_data ->> 'requested_role', 'teacher');
  branch := coalesce(auth_user.raw_user_meta_data ->> 'primary_branch', 'Shelter Okota');

  insert into public.profiles (
    id, full_name, email, phone, role, requested_role,
    primary_branch, authorized_branches, status, approved_at
  ) values (
    auth_user.id,
    coalesce(auth_user.raw_user_meta_data ->> 'full_name', split_part(auth_user.email, '@', 1)),
    lower(auth_user.email),
    auth_user.raw_user_meta_data ->> 'phone',
    case when not has_admin then 'global_admin' else requested_role end,
    requested_role,
    branch,
    case when not has_admin then array['Shelter Okota', 'Community Church', 'Anthony Church'] else array[branch] end,
    case when not has_admin then 'approved' else 'pending' end,
    case when not has_admin then now() else null end
  )
  returning * into existing_profile;

  return existing_profile;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;
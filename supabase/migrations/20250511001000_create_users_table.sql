-- Create a custom users table that extends Supabase's auth.users
create table if not exists public.users (
    id uuid references auth.users on delete cascade not null primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    date_of_birth date,
    gender text,
    phone text,
    emergency_contact text,
    blood_type text,
    allergies text[],
    medical_conditions text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own profile"
    on public.users for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.users for update
    using (auth.uid() = id);

-- Create a trigger to set updated_at on update
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.users
    for each row
    execute function public.handle_updated_at();

-- Function to automatically create a user profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user after auth.users insert
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

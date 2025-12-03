-- Function to check if an email exists in auth.users
-- This allows the frontend to validate emails against the real auth table securely
-- without exposing the entire user list.

create or replace function public.check_email_exists(email_to_check text)
returns boolean
language plpgsql
security definer -- Runs with privileges of the creator (postgres) to access auth.users
set search_path = public
as $$
begin
  return exists (
    select 1 from auth.users
    where lower(email) = lower(email_to_check)
  );
end;
$$;

-- Allow public access (so signup form can check)
grant execute on function public.check_email_exists(text) to anon, authenticated, service_role;

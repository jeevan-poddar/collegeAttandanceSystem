-- Jwt token add role
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role
  into user_role
  from public.users
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  claims := jsonb_set(
    claims,
    '{user_role}',
    to_jsonb(coalesce(user_role, 'unknown'))
  );

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

-- Grant the hook permission to read roles
grant usage on schema public to supabase_auth_admin;
grant select on table public.users to supabase_auth_admin;

revoke execute
on function public.custom_access_token_hook(jsonb)
from authenticated, anon, public;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

alter function public.set_updated_at() set search_path = '';

/*
# Fix is_admin() and get_user_role() to read from profiles table

The original implementations checked auth.jwt() -> 'app_metadata' ->> 'role',
but signUp() stores the role in user_metadata (not app_metadata), so is_admin()
always returned false. This prevented admins from seeing all requests, sessions,
users, and feedback in their dashboard.

The fix: query the profiles table directly for the current user's role.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
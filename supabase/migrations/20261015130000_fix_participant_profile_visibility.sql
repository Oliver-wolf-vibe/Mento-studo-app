/*
  Allow authenticated users to see only the profile rows needed by the MVP UI:
  approved mentors for discovery, and participants in their own request/match.
*/

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_mvp_participants"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.mentor_profiles mp
    WHERE mp.user_id = profiles.id
      AND mp.is_approved = true
  )
  OR EXISTS (
    SELECT 1 FROM public.mentorship_requests r
    WHERE (r.student_id = auth.uid() OR r.mentor_id = auth.uid())
      AND (r.student_id = profiles.id OR r.mentor_id = profiles.id)
  )
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.student_id = auth.uid() OR m.mentor_id = auth.uid())
      AND (m.student_id = profiles.id OR m.mentor_id = profiles.id)
  )
);

/*
# Dhaanish Mentor Platform - Part 2: RLS Policies and Storage Policies

Adds all Row Level Security policies for every table and storage bucket policies.
Tables were created in the `create_platform_tables` migration.
*/

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_own_or_admin"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================
-- STUDENT PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "student_profiles_select" ON public.student_profiles;
CREATE POLICY "student_profiles_select"
ON public.student_profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.student_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "student_profiles_insert_own" ON public.student_profiles;
CREATE POLICY "student_profiles_insert_own"
ON public.student_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "student_profiles_update_own" ON public.student_profiles;
CREATE POLICY "student_profiles_update_own"
ON public.student_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "student_profiles_delete_own" ON public.student_profiles;
CREATE POLICY "student_profiles_delete_own"
ON public.student_profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- MENTOR PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "mentor_profiles_select" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_select"
ON public.mentor_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin() OR is_approved = true);

DROP POLICY IF EXISTS "mentor_profiles_insert_own" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_insert_own"
ON public.mentor_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mentor_profiles_update_own_or_admin" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_update_own_or_admin"
ON public.mentor_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "mentor_profiles_delete_own_or_admin" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_delete_own_or_admin"
ON public.mentor_profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================
-- MENTORSHIP REQUESTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "requests_select_participants" ON public.mentorship_requests;
CREATE POLICY "requests_select_participants"
ON public.mentorship_requests FOR SELECT TO authenticated
USING (auth.uid() = student_id OR auth.uid() = mentor_id OR public.is_admin());

DROP POLICY IF EXISTS "requests_insert_student" ON public.mentorship_requests;
CREATE POLICY "requests_insert_student"
ON public.mentorship_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "requests_update_participants" ON public.mentorship_requests;
CREATE POLICY "requests_update_participants"
ON public.mentorship_requests FOR UPDATE TO authenticated
USING (auth.uid() = mentor_id OR auth.uid() = student_id OR public.is_admin())
WITH CHECK (auth.uid() = mentor_id OR auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "requests_delete_own" ON public.mentorship_requests;
CREATE POLICY "requests_delete_own"
ON public.mentorship_requests FOR DELETE TO authenticated
USING (auth.uid() = student_id OR public.is_admin());

-- ============================================================
-- MATCHES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "matches_select_participants" ON public.matches;
CREATE POLICY "matches_select_participants"
ON public.matches FOR SELECT TO authenticated
USING (auth.uid() = student_id OR auth.uid() = mentor_id OR public.is_admin());

DROP POLICY IF EXISTS "matches_insert_mentor_or_admin" ON public.matches;
CREATE POLICY "matches_insert_mentor_or_admin"
ON public.matches FOR INSERT TO authenticated
WITH CHECK (auth.uid() = mentor_id OR public.is_admin());

DROP POLICY IF EXISTS "matches_update_participants" ON public.matches;
CREATE POLICY "matches_update_participants"
ON public.matches FOR UPDATE TO authenticated
USING (auth.uid() = student_id OR auth.uid() = mentor_id OR public.is_admin())
WITH CHECK (auth.uid() = student_id OR auth.uid() = mentor_id OR public.is_admin());

DROP POLICY IF EXISTS "matches_delete_admin" ON public.matches;
CREATE POLICY "matches_delete_admin"
ON public.matches FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================
-- SESSIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "sessions_select_participants" ON public.sessions;
CREATE POLICY "sessions_select_participants"
ON public.sessions FOR SELECT TO authenticated
USING (auth.uid() = mentor_id OR auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "sessions_insert_mentor_or_admin" ON public.sessions;
CREATE POLICY "sessions_insert_mentor_or_admin"
ON public.sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = mentor_id OR public.is_admin());

DROP POLICY IF EXISTS "sessions_update_mentor_or_admin" ON public.sessions;
CREATE POLICY "sessions_update_mentor_or_admin"
ON public.sessions FOR UPDATE TO authenticated
USING (auth.uid() = mentor_id OR public.is_admin())
WITH CHECK (auth.uid() = mentor_id OR public.is_admin());

DROP POLICY IF EXISTS "sessions_delete_mentor_or_admin" ON public.sessions;
CREATE POLICY "sessions_delete_mentor_or_admin"
ON public.sessions FOR DELETE TO authenticated
USING (auth.uid() = mentor_id OR public.is_admin());

-- ============================================================
-- MESSAGES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
    AND (m.student_id = auth.uid() OR m.mentor_id = auth.uid())
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "messages_insert_participants" ON public.messages;
CREATE POLICY "messages_insert_participants"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
    AND (m.student_id = auth.uid() OR m.mentor_id = auth.uid())
  )
  AND auth.uid() = sender_id
);

DROP POLICY IF EXISTS "messages_update_participants" ON public.messages;
CREATE POLICY "messages_update_participants"
ON public.messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
    AND (m.student_id = auth.uid() OR m.mentor_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
    AND (m.student_id = auth.uid() OR m.mentor_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "messages_delete_admin" ON public.messages;
CREATE POLICY "messages_delete_admin"
ON public.messages FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================
-- FEEDBACK POLICIES
-- ============================================================
DROP POLICY IF EXISTS "feedback_select_participants" ON public.feedback;
CREATE POLICY "feedback_select_participants"
ON public.feedback FOR SELECT TO authenticated
USING (auth.uid() = student_id OR auth.uid() = mentor_id OR public.is_admin());

DROP POLICY IF EXISTS "feedback_insert_student" ON public.feedback;
CREATE POLICY "feedback_insert_student"
ON public.feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "feedback_delete_admin" ON public.feedback;
CREATE POLICY "feedback_delete_admin"
ON public.feedback FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Storage photos read all" ON storage.objects;
CREATE POLICY "Storage photos read all"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Storage photos insert own" ON storage.objects;
CREATE POLICY "Storage photos insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Storage photos update own" ON storage.objects;
CREATE POLICY "Storage photos update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Storage photos delete own" ON storage.objects;
CREATE POLICY "Storage photos delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid() = owner);
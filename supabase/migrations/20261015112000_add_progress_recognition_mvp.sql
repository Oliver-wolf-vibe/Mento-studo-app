/*
  Mentor-student MVP additions: progress updates and recognition points.
  This is a forward migration; existing migrations remain unchanged.
*/

CREATE TABLE IF NOT EXISTS public.progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  evidence_url text,
  mentor_advice text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_updates_student
  ON public.progress_updates(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_updates_match
  ON public.progress_updates(match_id, created_at DESC);
ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.point_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('session_completed', 'feedback_submitted', 'progress_posted')),
  points integer NOT NULL CHECK (points > 0),
  reference_id uuid NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_user
  ON public.point_ledger(user_id, created_at DESC);
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS progress_updates_updated_at ON public.progress_updates;
CREATE TRIGGER progress_updates_updated_at
  BEFORE UPDATE ON public.progress_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP POLICY IF EXISTS "progress_updates_select_participants" ON public.progress_updates;
CREATE POLICY "progress_updates_select_participants"
  ON public.progress_updates FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = progress_updates.match_id
        AND m.mentor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "progress_updates_insert_student" ON public.progress_updates;
CREATE POLICY "progress_updates_insert_student"
  ON public.progress_updates FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = progress_updates.match_id
        AND m.student_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "progress_updates_update_participants" ON public.progress_updates;
CREATE POLICY "progress_updates_update_participants"
  ON public.progress_updates FOR UPDATE TO authenticated
  USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = progress_updates.match_id
        AND m.mentor_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = student_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = progress_updates.match_id
        AND m.mentor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "progress_updates_delete_student_or_admin" ON public.progress_updates;
CREATE POLICY "progress_updates_delete_student_or_admin"
  ON public.progress_updates FOR DELETE TO authenticated
  USING (auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "point_ledger_select_own_or_admin" ON public.point_ledger;
CREATE POLICY "point_ledger_select_own_or_admin"
  ON public.point_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_event_type text,
  p_points integer,
  p_reference_id uuid,
  p_idempotency_key text
)
RETURNS public.point_ledger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  entry public.point_ledger;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF auth.uid() <> p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to award points for this user';
  END IF;

  IF p_event_type NOT IN ('session_completed', 'feedback_submitted', 'progress_posted') THEN
    RAISE EXCEPTION 'Unsupported point event';
  END IF;

  IF p_points <> (
    CASE p_event_type
      WHEN 'session_completed' THEN 25
      WHEN 'feedback_submitted' THEN 10
      WHEN 'progress_posted' THEN 15
    END 
  )THEN
    RAISE EXCEPTION 'Invalid point value for event';
  END IF;

  IF p_event_type = 'progress_posted' AND NOT EXISTS (
    SELECT 1 FROM public.progress_updates
    WHERE id = p_reference_id AND student_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Progress update does not belong to user';
  END IF;

  IF p_event_type = 'feedback_submitted' AND NOT EXISTS (
    SELECT 1 FROM public.feedback
    WHERE id = p_reference_id AND student_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Feedback does not belong to user';
  END IF;

  IF p_event_type = 'session_completed' AND NOT EXISTS (
    SELECT 1 FROM public.sessions
    WHERE id = p_reference_id AND student_id = p_user_id AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Completed session does not belong to user';
  END IF;

  INSERT INTO public.point_ledger (user_id, event_type, points, reference_id, idempotency_key)
  VALUES (p_user_id, p_event_type, p_points, p_reference_id, p_idempotency_key)
  ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
  RETURNING * INTO entry;

  RETURN entry;
END;
$func$;

CREATE OR REPLACE FUNCTION public.prevent_user_privilege_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id AND NOT public.is_admin() AND (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.is_active IS DISTINCT FROM OLD.is_active
  ) THEN
    RAISE EXCEPTION 'Only an administrator can change account privileges';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_changes ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_privilege_changes();

CREATE OR REPLACE FUNCTION public.prevent_mentor_approval_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.user_id AND NOT public.is_admin() AND (
    NEW.is_approved IS DISTINCT FROM OLD.is_approved
    OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
    OR NEW.current_mentee_count IS DISTINCT FROM OLD.current_mentee_count
  ) THEN
    RAISE EXCEPTION 'Only an administrator or trusted workflow can change mentor approval';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mentor_profiles_prevent_approval_changes ON public.mentor_profiles;
CREATE TRIGGER mentor_profiles_prevent_approval_changes
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_mentor_approval_changes();

REVOKE ALL ON FUNCTION public.award_points(uuid, text, integer, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, text, integer, uuid, text) TO authenticated;

-- New accounts are always students by default. Mentor and admin roles must be assigned by an administrator.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' IN ('student', 'mentor')
        THEN NEW.raw_user_meta_data ->> 'role'
      ELSE 'student'
    END
  );
  RETURN NEW;
END;
$$;

ALTER TABLE public.progress_updates REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'progress_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.progress_updates;
  END IF;
END;
$$;

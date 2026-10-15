/*
  Confirm a mentor-proposed time as one transactional student action.
  This migration is intentionally separate from the applied MVP migration.
*/

CREATE OR REPLACE FUNCTION public.confirm_mentorship_request(p_request_id uuid)
RETURNS public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  request_row public.mentorship_requests;
  mentor_row public.mentor_profiles;
  match_row public.matches;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO request_row
  FROM public.mentorship_requests
  WHERE id = p_request_id
    AND student_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship request not found';
  END IF;

  IF request_row.status <> 'proposed_time' OR request_row.proposed_time IS NULL THEN
    RAISE EXCEPTION 'This request does not have a pending proposed time';
  END IF;

  IF EXISTS (SELECT 1 FROM public.matches WHERE request_id = request_row.id) THEN
    RAISE EXCEPTION 'This request has already been confirmed';
  END IF;

  SELECT * INTO mentor_row
  FROM public.mentor_profiles
  WHERE user_id = request_row.mentor_id
  FOR UPDATE;

  IF NOT FOUND OR mentor_row.is_approved IS NOT TRUE THEN
    RAISE EXCEPTION 'This mentor is not currently approved';
  END IF;

  IF mentor_row.current_mentee_count >= mentor_row.max_mentees THEN
    RAISE EXCEPTION 'This mentor has reached capacity';
  END IF;

  INSERT INTO public.matches (request_id, student_id, mentor_id)
  VALUES (request_row.id, request_row.student_id, request_row.mentor_id)
  RETURNING * INTO match_row;

  INSERT INTO public.sessions (
    match_id,
    mentor_id,
    student_id,
    title,
    session_date,
    session_time,
    status
  )
  VALUES (
    match_row.id,
    request_row.mentor_id,
    request_row.student_id,
    'Mentoring Session',
    (request_row.proposed_time AT TIME ZONE 'UTC')::date,
    (request_row.proposed_time AT TIME ZONE 'UTC')::time,
    'scheduled'
  );

  UPDATE public.mentorship_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = request_row.id;

  UPDATE public.mentor_profiles
  SET current_mentee_count = current_mentee_count + 1,
      updated_at = now()
  WHERE id = mentor_row.id;

  INSERT INTO public.notifications (user_id, type, title, body, related_id)
  VALUES
    (
      request_row.mentor_id,
      'request_accepted',
      'Student confirmed your proposed session',
      'The student accepted your proposed time. Your session is now scheduled.',
      match_row.id
    ),
    (
      request_row.student_id,
      'session_scheduled',
      'Your mentoring session is confirmed',
      'Your proposed mentoring session has been scheduled.',
      match_row.id
    );

  RETURN match_row;
END;
$func$;

REVOKE ALL ON FUNCTION public.confirm_mentorship_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_mentorship_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_session_status(
  p_session_id uuid,
  p_status text
)
RETURNS public.sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  session_row public.sessions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_status NOT IN ('completed', 'cancelled', 'no_show') THEN
    RAISE EXCEPTION 'Unsupported session status';
  END IF;

  SELECT * INTO session_row
  FROM public.sessions
  WHERE id = p_session_id
    AND (mentor_id = auth.uid() OR public.is_admin())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or not authorized';
  END IF;

  IF session_row.status <> 'scheduled' THEN
    RAISE EXCEPTION 'Only scheduled sessions can be updated';
  END IF;

  UPDATE public.sessions
  SET status = p_status, updated_at = now()
  WHERE id = p_session_id
  RETURNING * INTO session_row;

  IF p_status = 'completed' THEN
    INSERT INTO public.point_ledger (user_id, event_type, points, reference_id, idempotency_key)
    VALUES (session_row.student_id, 'session_completed', 25, session_row.id, 'session_completed:' || session_row.id)
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, related_id)
  VALUES (
    session_row.student_id,
    'session_updated',
    'Session ' || replace(p_status, '_', ' '),
    'Your mentor updated "' || session_row.title || '" to ' || replace(p_status, '_', ' ') || '.',
    session_row.id
  );

  RETURN session_row;
END;
$func$;

REVOKE ALL ON FUNCTION public.update_session_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_session_status(uuid, text) TO authenticated;

/*
  Permit only relationship-backed cross-user notifications.
  Existing frontend notification writes remain compatible without allowing arbitrary spam.
*/

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_authorized_workflow"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin()
  OR (
    type = 'new_request'
    AND EXISTS (
      SELECT 1 FROM public.mentorship_requests r
      WHERE r.id = related_id
        AND r.mentor_id = auth.uid()
        AND r.student_id = user_id
    )
  )
  OR (
    type IN ('request_accepted', 'request_declined')
    AND EXISTS (
      SELECT 1 FROM public.mentorship_requests r
      WHERE r.id = related_id
        AND r.mentor_id = auth.uid()
        AND r.student_id = user_id
    )
  )
  OR (
    type = 'session_scheduled'
    AND (
      EXISTS (
        SELECT 1 FROM public.mentorship_requests r
        WHERE r.id = related_id
          AND r.mentor_id = auth.uid()
          AND r.student_id = user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.id = related_id
          AND s.mentor_id = auth.uid()
          AND s.student_id = user_id
      )
    )
  )
  OR (
    type = 'session_updated'
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = related_id
        AND s.mentor_id = auth.uid()
        AND s.student_id = user_id
    )
  )
  OR (
    type = 'new_feedback'
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = related_id
        AND s.student_id = auth.uid()
        AND s.mentor_id = user_id
    )
  )
  OR (
    type = 'new_message'
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = related_id
        AND ((m.student_id = auth.uid() AND m.mentor_id = user_id)
          OR (m.mentor_id = auth.uid() AND m.student_id = user_id))
    )
  )
);

-- Attendance access is controlled by the role claim and faculty assignment.
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_select_policy ON attendance;
DROP POLICY IF EXISTS attendance_insert_policy ON attendance;
DROP POLICY IF EXISTS attendance_update_policy ON attendance;

CREATE POLICY attendance_select_policy
ON attendance
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'user_role') IN ('faculty', 'hod'));

CREATE POLICY attendance_insert_policy
ON attendance
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'user_role') = 'hod'
  OR (
    (auth.jwt() ->> 'user_role') = 'faculty'
    AND EXISTS (
      SELECT 1
      FROM faculty f
      JOIN class_sessions cs
        ON cs.actual_faculty_id = f.id
      WHERE f.id = attendance.marked_by
        AND f.user_id = auth.uid()
        AND cs.id = attendance.class_session_id
    )
  )
);

CREATE POLICY attendance_update_policy
ON attendance
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'user_role') = 'hod'
  OR EXISTS (
    SELECT 1
    FROM faculty f
    JOIN class_sessions cs
      ON cs.actual_faculty_id = f.id
    WHERE (auth.jwt() ->> 'user_role') = 'faculty'
      AND f.user_id = auth.uid()
      AND f.id = attendance.marked_by
      AND cs.id = attendance.class_session_id
  )
)
WITH CHECK (
  (auth.jwt() ->> 'user_role') = 'hod'
  OR (
    (auth.jwt() ->> 'user_role') = 'faculty'
    AND EXISTS (
      SELECT 1
      FROM faculty f
      JOIN class_sessions cs
        ON cs.actual_faculty_id = f.id
      WHERE f.id = attendance.marked_by
        AND f.user_id = auth.uid()
        AND cs.id = attendance.class_session_id
    )
  )
);

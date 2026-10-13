-- QR scans are created by the authenticated student and then actioned by the
-- class faculty member (or an HOD). Apply this after 005AttendancePolicy.sql.
ALTER TABLE attendance ALTER COLUMN marked_by DROP NOT NULL;
UPDATE attendance
SET is_verified = true
WHERE is_verified IS NULL OR marked_by IS NOT NULL;
ALTER TABLE attendance ALTER COLUMN is_verified SET DEFAULT false;
ALTER TABLE attendance ALTER COLUMN is_verified SET NOT NULL;
ALTER TABLE attendance ALTER COLUMN status SET DEFAULT 'present';

DROP POLICY IF EXISTS attendance_insert_policy ON attendance;
DROP POLICY IF EXISTS attendance_update_policy ON attendance;
DROP POLICY IF EXISTS attendance_delete_policy ON attendance;

CREATE POLICY attendance_insert_policy
ON attendance
FOR INSERT
TO authenticated
WITH CHECK (
  (
    (auth.jwt() ->> 'user_role') = 'student'
    AND is_verified = false
    AND marked_by IS NULL
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = attendance.student_id AND s.user_id = auth.uid()
    )
  )
  OR (
    (auth.jwt() ->> 'user_role') = 'hod'
  )
  OR (
    (auth.jwt() ->> 'user_role') = 'faculty'
    AND EXISTS (
      SELECT 1 FROM faculty f
      JOIN class_sessions cs ON cs.actual_faculty_id = f.id
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
    SELECT 1 FROM faculty f
    JOIN class_sessions cs ON cs.actual_faculty_id = f.id
    WHERE (auth.jwt() ->> 'user_role') = 'faculty'
      AND f.user_id = auth.uid()
      AND cs.id = attendance.class_session_id
  )
)
WITH CHECK (
  (auth.jwt() ->> 'user_role') = 'hod'
  OR EXISTS (
    SELECT 1 FROM faculty f
    JOIN class_sessions cs ON cs.actual_faculty_id = f.id
    WHERE (auth.jwt() ->> 'user_role') = 'faculty'
      AND f.user_id = auth.uid()
      AND f.id = attendance.marked_by
      AND cs.id = attendance.class_session_id
  )
);

CREATE POLICY attendance_delete_policy
ON attendance
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'user_role') = 'hod'
  OR EXISTS (
    SELECT 1 FROM faculty f
    JOIN class_sessions cs ON cs.actual_faculty_id = f.id
    WHERE (auth.jwt() ->> 'user_role') = 'faculty'
      AND f.user_id = auth.uid()
      AND cs.id = attendance.class_session_id
  )
);

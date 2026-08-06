-- 1. Add group to student enrollments (e.g., a student is in 'G1')
ALTER TABLE student_batches ADD COLUMN batch_group VARCHAR;

-- 2. Add group to allocations (Prof. A teaches G1, Prof. B teaches G2)
ALTER TABLE faculty_allocations ADD COLUMN batch_group VARCHAR;

-- 3. Add group to the timetable and sessions
ALTER TABLE timetable_master ADD COLUMN batch_group VARCHAR;
ALTER TABLE class_sessions ADD COLUMN batch_group VARCHAR;

CREATE OR REPLACE FUNCTION generate_weekly_sessions(start_date DATE, end_date DATE)
RETURNS VOID AS $$
DECLARE
    current_date_val DATE;
    current_dow INTEGER;
BEGIN
    current_date_val := start_date;

    WHILE current_date_val <= end_date LOOP
        current_dow := EXTRACT(ISODOW FROM current_date_val);

        INSERT INTO class_sessions (
            timetable_master_id,
            batch_id,
            batch_group,     -- NEW: Added this
            subject_id,
            actual_faculty_id,
            session_date,
            status,
            is_proxy,
            is_extra_class
        )
        SELECT
            tm.id,
            tm.batch_id,
            tm.batch_group,  -- NEW: Pulling the group from the timetable
            tm.subject_id,
            tm.faculty_id,
            current_date_val,
            'scheduled'::session_status,
            FALSE,
            FALSE
        FROM timetable_master tm
        INNER JOIN batches b
            ON b.id = tm.batch_id
        WHERE tm.day_of_week = current_dow
          AND b.status = 'active'      
          AND NOT EXISTS (
              SELECT 1
              FROM class_sessions cs
              WHERE cs.timetable_master_id = tm.id
                AND cs.session_date = current_date_val
          );

        current_date_val := current_date_val + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;




ALTER TABLE faculty_allocations
DROP CONSTRAINT faculty_allocations_faculty_id_batch_id_subject_id_key;

ALTER TABLE faculty_allocations
ADD CONSTRAINT faculty_allocations_faculty_id_batch_id_subject_id_batch_group_key
UNIQUE (faculty_id, batch_id, subject_id, batch_group);
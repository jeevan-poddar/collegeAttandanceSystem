-- Timetable-only seed data for the existing 4 students and 1 faculty.
-- This reuses the current people records and creates timetable-related rows only.

DELETE FROM attendance;
DELETE FROM class_sessions;
DELETE FROM timetable_master;
DELETE FROM faculty_allocations;

DO $$
DECLARE
    v_batch_id INTEGER;
    v_faculty_id INTEGER;
    v_subject_calculus INTEGER;
    v_subject_physics INTEGER;
    v_subject_chemistry INTEGER;
    v_subject_maths INTEGER;
BEGIN
    SELECT id INTO v_batch_id
    FROM batches
    WHERE batch_code = '5CSE-A';

    IF v_batch_id IS NULL THEN
        INSERT INTO batches (batch_code, session_year, semester, branch, course, room_no)
        VALUES ('5CSE-A', '2023-2024', 1, 'CSE', 'B.Tech', '101')
        RETURNING id INTO v_batch_id;
    END IF;

    SELECT id INTO v_faculty_id
    FROM faculty
    ORDER BY id
    LIMIT 1;

    INSERT INTO subjects (subject_code, subject_name)
    VALUES
        ('BAS101', 'Calculus'),
        ('PHY101', 'Physics'),
        ('CHE101', 'Chemistry'),
        ('MAT102', 'Engineering Mathematics')
    ON CONFLICT (subject_code) DO NOTHING;

    SELECT id INTO v_subject_calculus FROM subjects WHERE subject_code = 'BAS101';
    SELECT id INTO v_subject_physics FROM subjects WHERE subject_code = 'PHY101';
    SELECT id INTO v_subject_chemistry FROM subjects WHERE subject_code = 'CHE101';
    SELECT id INTO v_subject_maths FROM subjects WHERE subject_code = 'MAT102';

    INSERT INTO student_batches (student_id, batch_id, status)
    SELECT s.id, v_batch_id, 'active'
    FROM students s
    WHERE NOT EXISTS (
        SELECT 1
        FROM student_batches sb
        WHERE sb.student_id = s.id AND sb.batch_id = v_batch_id
    )
    ORDER BY s.id;

    INSERT INTO faculty_allocations (faculty_id, batch_id, subject_id)
    SELECT v_faculty_id, v_batch_id, v_subject_calculus
    WHERE NOT EXISTS (
        SELECT 1 FROM faculty_allocations fa
        WHERE fa.faculty_id = v_faculty_id AND fa.batch_id = v_batch_id AND fa.subject_id = v_subject_calculus
    );

    INSERT INTO faculty_allocations (faculty_id, batch_id, subject_id)
    SELECT v_faculty_id, v_batch_id, v_subject_physics
    WHERE NOT EXISTS (
        SELECT 1 FROM faculty_allocations fa
        WHERE fa.faculty_id = v_faculty_id AND fa.batch_id = v_batch_id AND fa.subject_id = v_subject_physics
    );

    INSERT INTO faculty_allocations (faculty_id, batch_id, subject_id)
    SELECT v_faculty_id, v_batch_id, v_subject_chemistry
    WHERE NOT EXISTS (
        SELECT 1 FROM faculty_allocations fa
        WHERE fa.faculty_id = v_faculty_id AND fa.batch_id = v_batch_id AND fa.subject_id = v_subject_chemistry
    );

    INSERT INTO faculty_allocations (faculty_id, batch_id, subject_id)
    SELECT v_faculty_id, v_batch_id, v_subject_maths
    WHERE NOT EXISTS (
        SELECT 1 FROM faculty_allocations fa
        WHERE fa.faculty_id = v_faculty_id AND fa.batch_id = v_batch_id AND fa.subject_id = v_subject_maths
    );

    INSERT INTO timetable_master (batch_id, subject_id, faculty_id, day_of_week, period_number, room_no)
    VALUES
        (v_batch_id, v_subject_calculus, v_faculty_id, 1, 1, '101'),
        (v_batch_id, v_subject_physics, v_faculty_id, 1, 2, '101'),
        (v_batch_id, v_subject_chemistry, v_faculty_id, 3, 1, '101'),
        (v_batch_id, v_subject_maths, v_faculty_id, 3, 2, '101');

    INSERT INTO class_sessions (timetable_master_id, batch_id, subject_id, actual_faculty_id, session_date, status, is_proxy, is_extra_class)
    SELECT tm.id, v_batch_id, tm.subject_id, v_faculty_id, '2026-08-03', 'scheduled', FALSE, FALSE
    FROM timetable_master tm
    WHERE tm.batch_id = v_batch_id AND tm.day_of_week = 1
    ORDER BY tm.period_number;

    INSERT INTO class_sessions (timetable_master_id, batch_id, subject_id, actual_faculty_id, session_date, status, is_proxy, is_extra_class)
    SELECT tm.id, v_batch_id, tm.subject_id, v_faculty_id, '2026-08-05', 'scheduled', FALSE, FALSE
    FROM timetable_master tm
    WHERE tm.batch_id = v_batch_id AND tm.day_of_week = 3
    ORDER BY tm.period_number;
END $$;

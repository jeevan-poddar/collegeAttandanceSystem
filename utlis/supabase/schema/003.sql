-- ====================================================================================
-- AUTOMATION FUNCTION: Generate Sessions from Timetable
-- ====================================================================================
-- You can run this function every Sunday night via Supabase pg_cron, or call it from 
-- your Next.js API/Server Action passing the start and end dates of the week.


-- Example of how to call it from your Supabase SQL Editor to generate next week:
-- SELECT generate_weekly_sessions('2026-08-03', '2026-08-09')
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

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'generate-weekly-sessions-job', -- A unique name for your cron job
  '0 0 * * 0',                    -- Cron expression: Every Sunday at 00:00 (Midnight)
  $$ 
    -- The SQL query to run dynamically calculates the next 7 days
    SELECT generate_weekly_sessions(
      CURRENT_DATE, 
      CURRENT_DATE + integer '6'
    ); 
  $$
);

-- Run the same session-generation logic immediately for a manual test:
-- SELECT generate_weekly_sessions(CURRENT_DATE, CURRENT_DATE + INTEGER '6');

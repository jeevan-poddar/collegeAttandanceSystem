CREATE TYPE batch_status AS ENUM ('active', 'completed', 'inactive');

create table students (
    id serial primary key,
    user_id uuid unique not null references "users"(id) on delete cascade,
    name varchar not null,
    email varchar unique not null,
    phone numeric(10, 0) unique not null,
    parent_name varchar not null,
    c_roll_number integer unique not null,
    u_roll_number bigint unique not null,
    photo varchar,
    created_at timestamp default current_timestamp
);

create table batches(
    id serial primary key,
    batch_code varchar not null,
    session_year varchar not null,
    semester integer not null,
    branch varchar not null,
    course varchar not null,
    room_no varchar not null,
    status batch_status not null,
    created_at timestamp default current_timestamp
);

-- insert into batches(batch_code,session_year,semester,,branch,course,room_no,)
-- values
-- ('5CSE-B','2023-2024',1,'CSE','B.Tech','101'),
-- ('5ECE-B','2023-2024',2,'ECE','B.Tech','102'),
-- ('5ME-B','2023-2024',1,'ME','B.Tech','103'),
-- ('5CE-B','2023-2024',3,'CE','B.Tech','104');


create table student_batches(
    id serial primary key,
    student_id integer not null references students(id) on delete cascade,
    batch_id integer not null references batches(id) on delete cascade,
    created_at timestamp default current_timestamp,
    UNIQUE(student_id, batch_id) 

);


create table faculty(
    id serial primary key,
    user_id uuid unique not null references "users"(id) on delete cascade,
    name varchar not null,
    email varchar unique not null,
    phone numeric(10, 0) unique not null,
    photo varchar,
    created_at timestamp default current_timestamp
);
create table subjects(
    id serial primary key,
    subject_code varchar unique not null,
    subject_name varchar not null,
    created_at timestamp default current_timestamp
);

-- insert into subjects(subject_code,subject_name)
-- values
-- ('BAS101','Calculus'),
-- ('PHY101','Physics'),
-- ('CHE101','Chemistry'),
-- ('BIO101','Biology');


-- 1. Create Enums (PostgreSQL requires Enums to be created standalone before using them in tables)
-- Note: You will need to create the enum for your student_batches table as well if you haven't:
-- CREATE TYPE enrollment_status AS ENUM ('active', 'completed');

CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'holiday');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'outside');

-- 2. Faculty Allocations Table
-- Maps which faculty teaches which subject to which batch (The official assignment)
CREATE TABLE faculty_allocations (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT current_timestamp,
    -- Prevent duplicate assignments of the same teacher to the exact same batch & subject
    UNIQUE(faculty_id, batch_id, subject_id) 
);

-- 3. Timetable Master Table
-- The "Ideal" weekly routine.
CREATE TABLE timetable_master (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday, 7 = Sunday
    period_number INTEGER NOT NULL, -- e.g., 1, 2, 3, 4, 5
    room_no VARCHAR,
    created_at TIMESTAMP DEFAULT current_timestamp,
);
// set id of timetabelmaster to 1
ALTER SEQUENCE timetable_master_id_seq RESTART WITH 1;
-- insert into timetable_master(batch_id,subject_id,faculty_id,day_of_week,period_number,room_no)
-- values
-- (1,1,1,1,1,'101'),
-- (1,2,1,1,2,'101'),
-- (1,3,1,1,3,'101'),
-- (1,4,1,1,4,'101'),
-- (1,1,1,2,1,'101'),
-- (1,2,1,2,2,'101'),
-- (1,3,1,2,3,'101'),
-- (1,4,1,2,4,'101'),
-- (2,1,1,1,1,'102'),
-- (2,2,1,1,2,'102');
-- 4. Class Sessions Table (The most important table!)
-- Represents the actual, physical class happening on a specific date.
CREATE TABLE class_sessions (
    id SERIAL PRIMARY KEY,
    timetable_master_id INTEGER REFERENCES timetable_master(id) ON DELETE SET NULL,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    actual_faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    status session_status DEFAULT 'scheduled',
    is_proxy BOOLEAN DEFAULT FALSE,
    is_extra_class BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT current_timestamp
);

-- insert into class_sessions(timetable_master_id,batch_id,subject_id,actual_faculty_id,session_date,status,is_proxy,is_extra_class)
-- values
-- (1,1,1,1,'2026-08-03','scheduled',FALSE,FALSE),
-- (2,1,2,2,'2026-08-03','scheduled',FALSE,FALSE),
-- (3,1,3,3,'2026-08-03','scheduled',FALSE,FALSE),
-- (4,1,4,4,'2026-08-03','scheduled',FALSE,FALSE);
-- 5. Attendance Table
-- Links directly to the generated class_session, NOT the timetable.
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    class_session_id INTEGER NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    marked_by INTEGER NOT NULL REFERENCES faculty(id),
    marked_at TIMESTAMP DEFAULT current_timestamp,
    -- A student can only have ONE attendance record per specific class session
    UNIQUE(class_session_id, student_id)
);


-- ====================================================================================
-- AUTOMATION FUNCTION: Generate Sessions from Timetable
-- ====================================================================================
-- You can run this function every Sunday night via Supabase pg_cron, or call it from 
-- your Next.js API/Server Action passing the start and end dates of the week.

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
          AND b.status = 'active'      -- Only active batches
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

-- Example of how to call it from your Supabase SQL Editor to generate next week:
-- SELECT generate_weekly_sessions('2026-08-03', '2026-08-09')


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
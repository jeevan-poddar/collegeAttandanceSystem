CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'holiday');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'outside');
CREATE TYPE batch_status AS ENUM ('active', 'completed', 'inactive');

create table students (
    id serial primary key,
    user_id uuid unique not null references "users"(id) on delete cascade,
    name varchar not null,
    email varchar unique not null,
    phone numeric(10, 0) not null unique,
    parent_name varchar not null,
    c_roll_number integer unique not null,
    u_roll_number bigint unique not null,
    department_id int not null references departments(id),
    parent_phone numeric(10),
    session_year varchar(9) not null,
    photo varchar,
    created_at timestamp default current_timestamp
);

create table batches(
    id serial primary key,
    batch_code varchar not null,
    session_year varchar not null,
    semester integer not null,
    course varchar not null,
    room_no varchar not null,
    status batch_status not null,
    department_id int not null references departments(id),
    created_at timestamp default current_timestamp,
    UNIQUE(batch_code, session_year, semester, course, department_id)
);

create table student_batches(
    id serial primary key,
    student_id integer not null references students(id) on delete cascade,
    batch_id integer not null references batches(id) on delete cascade,
    batch_group VARCHAR,
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
    department_id int not null references departments(id),
    created_at timestamp default current_timestamp
);

create table subjects(
    id serial primary key,
    subject_code varchar unique not null,
    subject_name varchar not null,
    created_at timestamp default current_timestamp
);


-- 2. Faculty Allocations Table
CREATE TABLE faculty_allocations (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    batch_group VARCHAR,
    created_at TIMESTAMP DEFAULT current_timestamp,
    UNIQUE(faculty_id, batch_id, subject_id, batch_group)
);

-- 3. Timetable Master Table
CREATE TABLE timetable_master (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday, 7 = Sunday
    period_number INTEGER NOT NULL, -- e.g., 1, 2, 3, 4, 5
    batch_group VARCHAR, -- Optional: For cases where a batch is split into groups for certain subjects
    room_no VARCHAR,
    created_at TIMESTAMP DEFAULT current_timestamp,
    UNIQUE(batch_id, day_of_week, period_number, batch_group),
    UNIQUE(batch_id,faculty_id, day_of_week, period_number, batch_group)
);

CREATE TABLE class_sessions (
    id SERIAL PRIMARY KEY,
    timetable_master_id INTEGER REFERENCES timetable_master(id) ON DELETE SET NULL,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    batch_group VARCHAR,
    session_date DATE NOT NULL,
    status session_status DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT current_timestamp
);
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    class_session_id INTEGER NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'present',
    is_verified boolean NOT NULL DEFAULT false,
    marked_by INTEGER REFERENCES faculty(id),
    marked_at TIMESTAMP DEFAULT current_timestamp,
    UNIQUE(class_session_id, student_id)
);
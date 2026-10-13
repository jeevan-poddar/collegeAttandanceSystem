-- Schema update script for Supabase


Alter table students
add column department_id int not null references departments(id);
Alter table students
add column parent_phone numeric(10);
Alter table students
add column session_year varchar(9);

Alter table faculty
add column department varchar;

Create table departments (
    id serial primary key,
    name varchar(100) not null,
    s_name varchar not null
);
insert into departments (name, s_name) values ('Computer Science', 'CSE'),('Electronics and Communication', 'ECE'),('Mechanical', 'ME'),('Civil', 'CE'),('Computer Science and Information Technology', 'CSIT');

create table hod (
    id serial primary key,
    user_id uuid references users(id),
    department_id int references departments(id)
);

ALTER table faculty
drop column department;
ALTER table faculty
add column department_id int not null references departments(id);

ALTER TABLE hod
add column email varchar not null unique;
ALTER TABLE hod
add column name varchar not null;
ALTER TABLE hod
add column phone numeric(10, 0) unique not null;


ALTER TABLE batches
ADD COLUMN department_id int;

UPDATE batches b
SET department_id = d.id
FROM departments d
WHERE upper(trim(b.branch)) = upper(trim(d.s_name));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM batches WHERE department_id IS NULL) THEN
    RAISE EXCEPTION
      'Cannot migrate batches: one or more branch values do not match departments.s_name';
  END IF;
END $$;

ALTER TABLE batches
ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE batches
ADD CONSTRAINT batches_department_id_fkey
FOREIGN KEY (department_id)
REFERENCES departments(id);

CREATE INDEX batches_department_id_idx
ON batches(department_id);

ALTER TABLE batches
DROP COLUMN branch;



ALTER TABLE attendance
ADD COLUMN is_verified boolean DEFAULT false;
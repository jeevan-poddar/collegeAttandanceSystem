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
Create table departments (
    id serial primary key,
    name varchar(100) UNIQUE NOT NULL,
    s_name varchar UNIQUE NOT NULL,
    created_at timestamp default current_timestamp
);

create table hod (
    id serial primary key,
    user_id uuid  not null references users(id),
    department_id int UNIQUE NOT NULL references departments(id),
    name varchar not null,
    email varchar not null ,
    phone numeric(10, 0) not null,
    created_at timestamp default current_timestamp
);






-- ALTER TABLE batches
-- ADD COLUMN department_id int;

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

-- ALTER TABLE batches
-- ALTER COLUMN department_id SET NOT NULL;

-- ALTER TABLE batches
-- ADD CONSTRAINT batches_department_id_fkey
-- FOREIGN KEY (department_id)
-- REFERENCES departments(id);

CREATE INDEX batches_department_id_idx
ON batches(department_id);

-- ALTER TABLE batches
-- DROP COLUMN branch;



-- ALTER TABLE attendance
-- ADD COLUMN is_verified boolean DEFAULT false;
-- 1. Create the users table used by the auth trigger
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  full_name text,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', -- Extracts name from metadata
    new.email, 
    'student'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,   -- Fixed typo here
        email = EXCLUDED.email,
        role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
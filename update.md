1. When Email verification is enable then createUser should not redirect to the home page. it should show a message to the user to verify their email.

2. make polcies for tables in supabase for security.


3. For every years session value should update after 1st of June. For example if the current session is 2023-24 then after 1st of June it should update to 2024-25.

4. When Supabase returns an unauthorized response or PostgreSQL `42501` RLS error, refresh the session tokens and retry the request once.

5. Apply `utlis/supabase/schema/005AttendancePolicy.sql` in Supabase so faculty and HOD attendance upserts satisfy the attendance RLS policies.
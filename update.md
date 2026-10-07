1. When Email verification is enable then createUser should not redirect to the home page. it should show a message to the user to verify their email.

2. make polcies for tables in supabase for security.


3. For every years session year value should update after 1st of June. For example if the current session is 2023-24 then after 1st of June it should update to 2024-25.

4. When Supabase returns an unauthorized response or PostgreSQL `42501` RLS error, refresh the session tokens and retry the request once.

5. Apply `utlis/supabase/schema/005AttendancePolicy.sql` in Supabase so faculty and HOD attendance upserts satisfy the attendance RLS policies.

6. Check values befor submiiting in add batches it take input in characters and it should be in numbers only. If not then show error message to the user. check for other inputs too.

7. modification of Role assigned to someone by admin
8. Management of Department table by admin and HOD. Admin can add, update and delete department.
9. Proxy teacher assignment feature
10. Add , update and modify, delete class session and session status
11. Download reports for attendance and student details
12. Assigning correct values to allowed roles in `callWithRole` function and server side functions.


13. Make data entry easier using keyboard shortcuts.
14. Add ai to enter data in the field like time table allocation
15. qr based attandance system
16. notifcation system for students and faculty

17. my batches should have a year filter
18. hod can have list of all batches under his department and can view the students in those batches. he can also view the attendance of those students.

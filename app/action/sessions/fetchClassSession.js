"use server";

import { endOfWeek, format, startOfWeek } from "date-fns";
import { getUser } from "../auth/getUser";
import { createClient } from "@/utlis/supabase/server";

export async function fetchClassSession() {
  try {
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    const startDateValue = format(startDate, "yyyy-MM-dd");
    const endDateValue = format(endDate, "yyyy-MM-dd");
    const supabase = await createClient();
    const user = await getUser(["faculty", "hod"]);
    // console.log("time:", new Date());

    if (!user?.id) {
      return {
        success: false,
        error: "User not authenticated or profile not found.",
      };
    }

    const { data: facultyRecord, error: facultyError } = await supabase
      .from("faculty")
      .select("id")
      .eq("user_id", user.id) // Assuming your faculty table has a 'user_id' UUID column
      .single();

    if (facultyError || !facultyRecord) {
      return {
        success: false,
        error: "Faculty profile not found in database.",
      };
    }
    const facultyId = facultyRecord.id;

    const { data: myTimetables } = await supabase
      .from("timetable_master")
      .select("id")
      .eq("faculty_id", facultyId);

    // Create an array of just the IDs (e.g., [1, 5, 12])
    const timetableIds = myTimetables?.map((t) => t.id) || [];

    // Step 2: Build the OR string safely for a single table
    let orQuery = `faculty_id.eq.${facultyId}`;
    if (timetableIds.length > 0) {
      // Add the second condition: "OR the timetable_master_id is in this list of IDs"
      orQuery += `,timetable_master_id.in.(${timetableIds.join(",")})`;
    }

    const { data: sessions, error } = await supabase
      .from("class_sessions")
      .select(
        `
      id,
      session_date,
      status,
      faculty_id,
      batch_group,
      batches ( id, batch_code, semester, department_id, course, status, departments(id, s_name) ),
      subjects ( subject_name ),
      attendance ( count ),
      timetable_master ( period_number, room_no, faculty_id, batch_group )
    `,
      )
      .gte("session_date", startDateValue)
      .lte("session_date", endDateValue)
      .eq("attendance.is_verified", true)
      .order("session_date", { ascending: true })
      .order("timetable_master_id", { ascending: true })
      .or(orQuery); // Use our safe, single-table OR query

    if (error) {
      console.error("Fetch Routine Error:", error.message);
      return { success: false, error: error.message };
    }

    // 3. Format the data to match your EXACT required structure
    const formattedSessions = sessions.map((session) => {
      // Get the day of the week (e.g., 'Monday') from the session_date
      const dateObj = new Date(session.session_date);
      const dayName = dateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });

      return {
        id: session.id,
        day: dayName,
        period: session.timetable_master?.period_number ?? null,
        subject: session.subjects.subject_name,
        batchId: session.batches.id,
        batch_code: session.batches.batch_code,
        batch_group:
          session.batch_group || session.timetable_master?.batch_group || null,
        sem: session.batches.semester,
        room: session.timetable_master?.room_no ?? null,
        branch: session.batches.departments?.s_name || "",
        course: session.batches.course,
        batch_status: session.batches.status,
        attendance_marked: (session.attendance?.[0]?.count || 0) > 0,
        class_type: !session.timetable_master
          ? "extra"
          : session.faculty_id !== session.timetable_master.faculty_id
            ? "proxy"
            : "normal",
        proxy_teacher:
          session.timetable_master &&
          session.faculty_id !== session.timetable_master.faculty_id
            ? session.faculty_id
            : null,
        status: session.status,
        session_date: session.session_date,
      };
    }).sort((left, right) => {
      const leftDate = new Date(left.session_date).getTime();
      const rightDate = new Date(right.session_date).getTime();
      return leftDate - rightDate || left.period - right.period;
    });
    // console.log("Formatted Sessions:", formattedSessions);
    return formattedSessions;
  } catch (error) {
    console.error("Error fetching class sessions:", error.message);
    return { success: false, error: error.message };
  }
}

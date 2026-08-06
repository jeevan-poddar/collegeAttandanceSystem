"use server";

import { endOfWeek, startOfWeek } from "date-fns";
import { getUser } from "./getUser";
import { createClient } from "@/utlis/supabase/server";

export async function fetchClassSession() {
  try {
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    const supabase = await createClient();
    const user = await getUser();

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
    let orQuery = `actual_faculty_id.eq.${facultyId}`;
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
      is_proxy,
      actual_faculty_id,
      batch_group,
      batches ( id, batch_code, semester, branch, course ),
      subjects ( subject_name ),
      timetable_master!inner ( period_number, room_no, faculty_id, batch_group )
    `,
      )
      .gte("session_date", startDate.toISOString()) // Good practice to format dates to ISO
      .lte("session_date", endDate.toISOString())
      .or(orQuery); // Use our safe, single-table OR query

    if (error) {
      console.error("Fetch Routine Error:", error.message);
      return { success: false, error: error.message };
    }

    // 3. Format the data to match your EXACT required structure
    const formattedSessions = sessions.map((session) => {
      // Get the day of the week (e.g., 'Monday') from the session_date
      const dateObj = new Date(session.session_date);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

      return {
        id: session.id,
        day: dayName,
        period: session.timetable_master.period_number,
        subject: session.subjects.subject_name,
        batchId: session.batches.id,
        batch_code: session.batches.batch_code,
        batch_group: session.batch_group || session.timetable_master?.batch_group || null,
        sem: session.batches.semester,
        room: session.timetable_master.room_no,
        branch: session.batches.branch,
        course: session.batches.course,
        is_proxy: session.is_proxy,
        // If they are not the actual teacher, someone else is taking it (Proxy)
        proxy_teacher:
          session.is_proxy && session.actual_faculty_id !== facultyId
            ? session.actual_faculty_id
            : null,
        status: session.status,
        session_date: session.session_date,
      };
    });
    // console.log("Formatted Sessions:", formattedSessions);
    return formattedSessions;
  } catch (error) {
    console.error("Error fetching class sessions:", error.message);
    return { success: false, error: error.message };
  }
}

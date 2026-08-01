"use server";

import { createClient } from "@/utlis/supabase/server";

export async function fetchAttendance(sessionId) {
  try {
    if (!sessionId) {
      return {
        success: false,
        error: "Session ID is required.",
      };
    }

    console.log("Fetching attendance for session ID:", sessionId);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("attendance")
      .select("student_id, status")
      .eq("class_session_id", sessionId);

    console.log("Fetched Attendance Data:", data);

    if (error) {
      console.error("Attendance fetch error:", error);
      return {
        success: false,
        error: error.message || "Error fetching attendance from database.",
      };
    }

    const normalizedAttendance = (data ?? []).reduce((acc, row) => {
      if (row?.student_id != null) {
        acc[row.student_id] = row.status;
      }
      return acc;
    }, {});

    return {
      success: true,
      data: normalizedAttendance,
    };
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching attendance.",
    };
  }
}

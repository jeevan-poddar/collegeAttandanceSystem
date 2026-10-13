"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function fetchOverallAttendance(batchId, sessionIds, studentIds) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, [
      "student",
      "faculty",
      "hod",
      "admin",
    ]);
    if (!auth.success) return auth;

    if (!Array.isArray(sessionIds) || !Array.isArray(studentIds)) {
      return {
        success: false,
        error: "Session and student identifiers are required.",
      };
    }

    if (sessionIds.length === 0 || studentIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data: attendanceData, error } = await supabase
      .from("attendance")
      .select("class_session_id, student_id, status")
      .in("class_session_id", sessionIds)
      .in("student_id", studentIds);

    if (error) {
      console.error("Error fetching attendance for overall:", error.message);
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: attendanceData,
    };
  } catch (error) {
    console.error("Error fetching attendance for overall:", error);
    return {
      success: false,
      error:
        "An unexpected error occurred while fetching attendance for overall.",
    };
  }
}

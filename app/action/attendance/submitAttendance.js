"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function submitAttendance(attendanceData) {
  const supabase = await createClient();
  const auth = await getAuthClaims(supabase, ["faculty", "hod"]);
  if (!auth.success) return auth;

  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    return {
      success: false,
      message: "Attendance data is required.",
    };
  }

  const sessionIds = new Set(
    attendanceData.map((record) => record?.class_session_id),
  );
  if (sessionIds.size !== 1 || sessionIds.has(undefined)) {
    return {
      success: false,
      message: "Attendance must belong to one class session.",
    };
  }

  const classSessionId = attendanceData[0].class_session_id;
  let facultyDetails;
  try {
    const { data, error: facultyError } = await supabase
      .from("faculty")
      .select("*")
      .eq("user_id", auth.userId)
      .single();
    if (facultyError) {
      console.error("Error fetching faculty details:", facultyError);
      return;
    }
    facultyDetails = data;
  } catch (error) {
    console.error("Error fetching faculty details:", error);
    return;
  }
  // console.log("Faculty Details:", facultyDetails); // Log the faculty details to verify it's being retrieved correctly
  const facultyId = facultyDetails.id;
  const recordToSubmit = attendanceData.map((student) => ({
    ...student,
    marked_by: facultyId,
    is_verified: true,
  }));

  const { error: upsertError } = await supabase
    .from("attendance")
    .upsert(recordToSubmit, {
      onConflict: "class_session_id,student_id",
      ignoreDuplicates: false,
    });

  if (upsertError) {
    console.error("Error upserting attendance records:", upsertError);
    return {
      success: false,
      message: "Failed to save attendance.",
      error: upsertError.message,
    };
  }

  const { error: sessionUpdateError } = await supabase
    .from("class_sessions")
    .update({ status: "completed" })
    .eq("id", classSessionId)
    .in("status", ["scheduled", "completed"])
    .select("id")
    .single();

  if (sessionUpdateError) {
    console.error("Error updating class session status:", sessionUpdateError);
    return {
      success: false,
      message: "Attendance was saved, but the session status could not be updated.",
      error: sessionUpdateError.message,
    };
  }

  // console.log("Attendance records submitted successfully.");
  return { success: true, message: "Attendance submitted successfully." };
}

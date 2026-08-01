"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUser } from "./getUser";

export async function submitAttendance(attendanceData) {
  const supabase = await createClient();
  const user = await getUser();
  console.log("User object:", user); // Log the entire user object to verify its structure
  console.log("User ID2:", user.id); // Log the user ID to verify it's being retrieved correctly
  let facultyDetails;
  try {
    const { data, error: facultyError } = await supabase
      .from("faculty")
      .select("*")
      .eq("user_id", user.id)
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
  console.log("Faculty Details:", facultyDetails); // Log the faculty details to verify it's being retrieved correctly
  const facultyId = facultyDetails.id;
  const recordToSubmit = attendanceData.map((student) => ({
    ...student,
    marked_by: facultyId,
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

  console.log("Attendance records submitted successfully.");
  return { success: true, message: "Attendance submitted successfully." };
}

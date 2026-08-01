"use server";

import { createClient } from "@/utlis/supabase/server";

export async function fetchSessionForAttandance(batchId, subjectId) {
  try {
    console.log("Fetching sessions for attendance with batchId:", batchId, "and subjectId:", subjectId);
    const supabase = await createClient();
    const { data: sessions, error } = await supabase
      .from("class_sessions")
      .select("id, session_date")
      .eq("batch_id", batchId)
      .eq("subject_id", subjectId);
    sessions.sort(
      (a, b) => new Date(a.session_date) - new Date(b.session_date),
    );

    if (error) {
      console.error("Error fetching sessions for attendance:", error.message);
      return { success: false, error: error.message };
    }
    console.log("Fetched sessions for attendance:", sessions);
    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error fetching sessions for attendance:", error.message);
    return { success: false, error: error.message };
  }
}

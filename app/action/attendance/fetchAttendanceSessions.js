"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function fetchAttendanceSessions(
  batchId,
  subjectId,
  batchGroup = null,
) {
  try {
    console.log(
      "Fetching sessions for attendance with batchId:",
      batchId,
      "subjectId:",
      subjectId,
      "batchGroup:",
      batchGroup,
    );
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["faculty", "hod", "admin"]);
    if (!auth.success) return auth;

    const { data: sessions, error } = await supabase
      .from("class_sessions")
      .select("id, session_date, batch_group")
      .eq("batch_id", batchId)
      .eq("subject_id", subjectId)
      .order("session_date", { ascending: true });

    if (error || !sessions) {
      console.error("Error fetching sessions for attendance:", error?.message);
      return {
        success: false,
        error: error?.message || "No session records returned.",
      };
    }

    let filteredSessions = [...sessions].sort(
      (a, b) => new Date(a.session_date) - new Date(b.session_date),
    );

    if (
      batchGroup &&
      batchGroup !== "ALL" &&
      batchGroup !== "All" &&
      batchGroup !== ""
    ) {
      filteredSessions = filteredSessions.filter((s) => {
        const g = s.batch_group;
        return !g || g === "ALL" || g === "All" || g === "" || g === batchGroup;
      });
    }

    console.log("Fetched sessions for attendance:", filteredSessions.length);
    return { success: true, data: filteredSessions };
  } catch (error) {
    console.error("Error fetching sessions for attendance:", error.message);
    return { success: false, error: error.message };
  }
}

"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function createBatches(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      error: "Cannot submit: No batch rows were added.",
    };
  }

  const formatData = data.map((item) => ({
    batch_code: item.batch_code?.trim() || "",
    session_year: item.session_year?.trim() || "",
    semester: parseInt(item.semester, 10) || 0,
    department_id: Number(item.department_id) || 0,
    course: item.course?.trim() || "",
    room_no: item.room_no?.trim() || "",
  }));
  if (formatData.some((item) => item.department_id <= 0)) {
    return {
      success: false,
      error: "Every batch must be assigned to a valid department.",
    };
  }
  // console.log("Formatted Data:", formatData);

  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) return auth;

    const { error } = await supabase.from("batches").insert(formatData);
    if (error) {
      console.error("Error submitting batches:", error);
      return {
        success: false,
        error: getUserFriendlyError(
          error,
          "Failed to save batches to database.",
        ),
      };
    }
    // console.log("Batches submitted successfully");
    return { success: true, message: "Batches registered successfully." };
  } catch (error) {
    console.error("Error submitting batches:", error);
    return {
      success: false,
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred while saving batches.",
      ),
    };
  }
}

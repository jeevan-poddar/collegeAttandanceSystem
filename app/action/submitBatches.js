"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function submitBatches(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { success: false, error: "Cannot submit: No batch rows were added." };
  }

  const formatData = data.map((item) => ({
    batch_code: item.batch_code?.trim() || "",
    session_year: item.session_year?.trim() || "",
    semester: parseInt(item.semester, 10) || 0,
    branch: item.branch?.trim() || "",
    course: item.course?.trim() || "",
    room_no: item.room_no?.trim() || "",
  }));
  console.log("Formatted Data:", formatData);

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("batches").insert(formatData);
    if (error) {
      console.error("Error submitting batches:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to save batches to database."),
      };
    }
    console.log("Batches submitted successfully");
    return { success: true, message: "Batches registered successfully." };
  } catch (error) {
    console.error("Error submitting batches:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while saving batches."),
    };
  }
}


"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function submitStudentBatches(data) {
  console.log("Submitting student_batches data:", data);
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("student_batches").insert(data);

    if (error) {
      console.error("Error inserting student_batches:", error);
      return { success: false, error: getUserFriendlyError(error, "Failed to enroll students into batch.") };
    }

    console.log("Student batch assignments inserted successfully");
    return { success: true, message: "Students assigned to batch successfully." };
  } catch (error) {
    console.error("Error inserting student_batches:", error);
    return { success: false, error: getUserFriendlyError(error, "An unexpected error occurred during assignment.") };
  }
}

export async function removeStudentFromBatch(studentId, batchId) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("student_batches")
      .delete()
      .eq("student_id", studentId)
      .eq("batch_id", batchId);

    if (error) {
      console.error("Error removing student from batch:", error);
      return { success: false, error: getUserFriendlyError(error, "Failed to remove student from batch.") };
    }
    return { success: true, message: "Student removed from batch successfully." };
  } catch (error) {
    console.error("Error removing student from batch:", error);
    return { success: false, error: getUserFriendlyError(error, "An unexpected error occurred during removal.") };
  }
}

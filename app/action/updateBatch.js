"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function updateBatch(id, updatedFields) {
  try {
    const supabase = await createClient();

    const payload = {
      batch_code: updatedFields.batch_code,
      session_year: updatedFields.session_year,
      semester: parseInt(updatedFields.semester, 10) || 0,
      branch: updatedFields.branch,
      course: updatedFields.course,
      room_no: updatedFields.room_no,
      status: updatedFields.status, // "active", "inactive", "complete"
    };

    const { data, error } = await supabase
      .from("batches")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating batch:", error);
      return { success: false, error: getUserFriendlyError(error, "Failed to save batch updates.") };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating batch:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while updating batch."),
    };
  }
}

export async function deleteBatch(id) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("batches").delete().eq("id", id);

    if (error) {
      console.error("Error deleting batch:", error);
      return { success: false, error: getUserFriendlyError(error, "Failed to delete batch.") };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting batch:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while deleting batch."),
    };
  }
}

"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function updateSubject(id, updatedFields) {
  try {
    const supabase = await createClient();

    const payload = {
      subject_code: updatedFields.subject_code,
      subject_name: updatedFields.subject_name,
    };

    const { data, error } = await supabase
      .from("subjects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subject:", error);
      return { success: false, error: getUserFriendlyError(error, "Failed to update subject.") };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating subject:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while updating subject."),
    };
  }
}

export async function deleteSubject(id) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("subjects").delete().eq("id", id);

    if (error) {
      console.error("Error deleting subject:", error);
      return { success: false, error: getUserFriendlyError(error, "Failed to delete subject.") };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting subject:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while deleting subject."),
    };
  }
}

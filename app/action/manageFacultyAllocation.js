"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function fetchAllocatedFaculty() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("faculty_allocations").select("*");

    if (error) {
      console.error("Error fetching faculty allocations:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to fetch faculty allocations from database."),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching faculty allocations:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while loading allocations."),
    };
  }
}

export async function updateFacultyAllocation(id, updatedFields) {
  if (!id) {
    return { success: false, error: "Missing allocation record ID for update." };
  }
  try {
    const supabase = await createClient();
    const payload = {
      faculty_id: updatedFields.faculty_id,
      batch_id: updatedFields.batch_id,
      subject_id: updatedFields.subject_id,
      batch_group: updatedFields.batch_group || null,
    };

    const { data, error } = await supabase
      .from("faculty_allocations")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating faculty allocation:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to update faculty allocation in database."),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating faculty allocation:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred during update."),
    };
  }
}

export async function deleteFacultyAllocation(id) {
  if (!id) {
    return { success: false, error: "Missing allocation record ID for deletion." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("faculty_allocations").delete().eq("id", id);

    if (error) {
      console.error("Error deleting faculty allocation:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to remove faculty allocation from database."),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting faculty allocation:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while removing allocation."),
    };
  }
}

"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function fetchAllTimetables() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("timetable_master").select("*");

    if (error) {
      console.error("Error fetching timetable records:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to fetch timetable schedules from database."),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching timetable:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while loading timetable records."),
    };
  }
}

export async function updateTimetable(id, updatedFields) {
  if (!id) {
    return { success: false, error: "Missing timetable record ID for update." };
  }
  try {
    const supabase = await createClient();
    const payload = {
      batch_id: updatedFields.batch_id,
      subject_id: updatedFields.subject_id,
      faculty_id: updatedFields.faculty_id,
      day_of_week: parseInt(updatedFields.day_of_week, 10) || 1,
      period_number: parseInt(updatedFields.period_number, 10) || 0,
      room_no: updatedFields.room_no?.toString().trim() || "",
      batch_group: updatedFields.batch_group || null,
    };

    const { data, error } = await supabase
      .from("timetable_master")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating timetable record:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to save timetable schedule update in database."),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating timetable:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while saving timetable update."),
    };
  }
}

export async function deleteTimetable(id) {
  if (!id) {
    return { success: false, error: "Missing timetable record ID for deletion." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("timetable_master").delete().eq("id", id);

    if (error) {
      console.error("Error deleting timetable record:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to remove timetable record from database."),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting timetable:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while removing timetable record."),
    };
  }
}

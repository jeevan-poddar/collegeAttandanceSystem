"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function submitTimeTable(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { success: false, error: "Cannot submit: No timetable rows were provided." };
  }

  const formatData = data.map((item) => ({
    batch_id: item.batch_id,
    subject_id: item.subject_id,
    faculty_id: item.faculty_id,
    day_of_week: parseInt(item.day_of_week, 10) || 1,
    period_number: parseInt(item.period_number, 10) || 0,
    room_no: item.room_no?.toString().trim() || "",
    batch_group: item.batch_group || null,
  }));
  console.log("Formatted Data:", formatData);

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("timetable_master").insert(formatData);
    if (error) {
      console.error("Error submitting timetable:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to register timetable schedule in database."),
      };
    }
    console.log("Timetable submitted successfully");
    return { success: true, message: "Timetable schedule registered successfully." };
  } catch (error) {
    console.error("Error submitting timetable:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while saving timetable."),
    };
  }
}

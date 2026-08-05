"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

export async function submitSubject(data) {
  console.log("Data to insert:", data);
  if (!Array.isArray(data) || data.length === 0) {
    return { success: false, error: "Cannot submit: No subject rows were added." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("subjects").insert(data);
    if (error) {
      console.error("Error inserting subjects:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to submit subjects."),
      };
    }
    console.log("Subjects submitted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error submitting subject:", error);
    return {
      success: false,
      error: getUserFriendlyError(error, "An unexpected error occurred while saving subjects."),
    };
  }
}

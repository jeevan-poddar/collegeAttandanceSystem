"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function createFacultyAllocations(data) {
  console.log("Data to insert:", data);
  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      error: "Cannot submit: No faculty allocation rows were provided.",
    };
  }

  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin", "hod"]);
    if (!auth.success) return auth;

    const { error } = await supabase.from("faculty_allocations").insert(data);

    if (error) {
      console.error("Error inserting data:", error);
      return {
        success: false,
        error: getUserFriendlyError(
          error,
          "Failed to submit faculty allocations to database.",
        ),
      };
    }
    console.log("Faculty allocation data inserted successfully");
    return {
      success: true,
      message: "Faculty allocations saved successfully.",
    };
  } catch (error) {
    console.error("Error inserting data:", error);
    return {
      success: false,
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred during faculty allocation.",
      ),
    };
  }
}

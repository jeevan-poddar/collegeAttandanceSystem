"use server";

import { createClient } from "@/utlis/supabase/server";

export async function submitStudentBatches(data) {
  console.log("Submitting student_batches data:", data);
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("student_batches").insert(data);

    if (error) {
      console.error("Error inserting student_batches:", error);
      return { success: false, error: error.message };
    }

    console.log("Student batch assignments inserted successfully");
    return { success: true, message: "Students assigned to batch successfully" };
  } catch (error) {
    console.error("Error inserting student_batches:", error);
    return { success: false, error: "An unexpected error occurred during assignment." };
  }
}

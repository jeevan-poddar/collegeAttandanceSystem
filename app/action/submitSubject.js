"use server";

import { createClient } from "@/utlis/supabase/server";

export async function submitSubject(data) {
    console.log("Data to insert:", data);
    // return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("subjects").insert(data);
    if (error) {
      throw new Error(error.message);
    }
    console.log("Subjects submitted successfully");
  } catch (error) {
    console.error("Error submitting subject:", error.message);
  }
}

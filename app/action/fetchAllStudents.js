"use server";

import { createClient } from "@/utlis/supabase/server";

export async function fetchAllStudents() {
  try {
    const supabase = await createClient();
    const { data: students, error } = await supabase
      .from("students")
      .select("id, name, email, phone, parent_name, c_roll_number, u_roll_number")
      .order("c_roll_number", { ascending: true });

    if (error) {
      console.error("Error fetching all students:", error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    console.error("Error fetching all students:", error);
    return { success: false, error: "An unexpected error occurred while fetching students." };
  }
}

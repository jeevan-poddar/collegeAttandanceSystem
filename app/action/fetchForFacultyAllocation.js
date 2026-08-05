"use server";

import { createClient } from "@/utlis/supabase/server";

export async function fetchFaculty() {
  try {
    const supabase = await createClient();
    const { data: faculty, error } = await supabase
      .from("faculty")
      .select("id,name");
    if (error) {
      console.error("Error fetching faculty:", error.message);
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: faculty,
    };
  } catch (error) {
    console.error("Error fetching faculty:", error);
    throw error;
  }
}
export async function fetchBatches(sessionYear) {
  try {
    const supabase = await createClient();
    let query = supabase.from("batches").select("*");
    if (sessionYear && typeof sessionYear === "string" && sessionYear.trim() !== "" && sessionYear.toUpperCase() !== "ALL") {
      query = query.eq("session_year", sessionYear.trim());
    }
    const { data: batches, error } = await query;
    if (error) {
      console.error("Error fetching batches:", error.message);
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: batches,
    };
  } catch (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }
}
export async function fetchSubject() {
  try {
    const supabase = await createClient();
    const { data: subject, error } = await supabase
      .from("subjects")
      .select("id,subject_name,subject_code");
    if (error) {
      console.error("Error fetching subject:", error.message);
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: subject,
    };
  } catch (error) {
    console.error("Error fetching subject:", error);
    throw error;
  }
}

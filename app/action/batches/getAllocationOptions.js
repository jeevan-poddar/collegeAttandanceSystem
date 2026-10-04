"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function getFaculty() {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin", "hod"]);
    if (!auth.success) return auth;

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
export async function getBatchesForAllocation(sessionYear) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin", "hod"]);
    if (!auth.success) return auth;

    let query = supabase.from("batches").select("*");
    if (
      sessionYear &&
      typeof sessionYear === "string" &&
      sessionYear.trim() !== "" &&
      sessionYear.toUpperCase() !== "ALL"
    ) {
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

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

    let query = supabase
      .from("batches")
      .select("*, departments(id, s_name)");
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
      data: (batches || []).map((batch) => ({
        ...batch,
        branch: batch.departments?.s_name || batch.branch || "",
      })),
    };
  } catch (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }
}

export async function getHodBatches(sessionYear = "ALL") {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["hod"]);
    if (!auth.success) return auth;

    const { data: hod, error: hodError } = await supabase
      .from("hod")
      .select("department_id, departments(s_name)")
      .eq("user_id", auth.userId)
      .single();

    if (hodError || !hod) {
      console.error("Error fetching HOD department:", hodError?.message);
      return {
        success: false,
        error: "Unable to determine the HOD department.",
      };
    }

    if (!hod.department_id) {
      console.error("HOD department is not configured.");
      return {
        success: false,
        error: "The HOD department is not configured.",
      };
    }

    let query = supabase
      .from("batches")
      .select("*, departments(id, s_name)")
      .eq("department_id", hod.department_id)
      .order("batch_code", { ascending: true });

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
      console.error("Error fetching HOD department batches:", error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (batches || []).map((batch) => ({
        ...batch,
        branch: batch.departments?.s_name || batch.branch || "",
      })),
    };
  } catch (error) {
    console.error("Unexpected error fetching HOD department batches:", error);
    return {
      success: false,
      error: "An unexpected error occurred while loading department batches.",
    };
  }
}

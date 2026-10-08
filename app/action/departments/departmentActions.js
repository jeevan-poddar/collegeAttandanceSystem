"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function createDepartment(data) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) return auth;

    if (!data.name || !data.s_name) {
        return {
            success: false,
            error: "Department name and short name are required."
        };
    }

    const { error } = await supabase.from("departments").insert([{
        name: data.name,
        s_name: data.s_name
    }]);

    if (error) {
      console.error("Error inserting department:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to create department."),
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Error submitting department:", error);
    return {
      success: false,
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred while saving the department.",
      ),
    };
  }
}

export async function updateDepartment(id, updatedFields) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) return auth;

    const payload = {
      name: updatedFields.name,
      s_name: updatedFields.s_name,
    };

    const { data, error } = await supabase
      .from("departments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating department:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to update department."),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating department:", error);
    return {
      success: false,
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred while updating the department.",
      ),
    };
  }
}

export async function deleteDepartment(id) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) return auth;

    const { error } = await supabase.from("departments").delete().eq("id", id);

    if (error) {
      console.error("Error deleting department:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to delete department. It might be referenced by other records (e.g. students or faculty)."),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting department:", error);
    return {
      success: false,
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred while deleting the department.",
      ),
    };
  }
}

export async function getDepartments() {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin", "hod", "faculty"]);
    if (!auth.success) return auth;

    const { data: departments, error } = await supabase
      .from("departments")
      .select("id, name, s_name")
      .order("name");

    if (error) {
      console.error("Error fetching departments:", error.message);
      return { success: false, error: error.message };
    }
    return {
      success: true,
      data: departments,
    };
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
}

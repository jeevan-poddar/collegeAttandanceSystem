"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUserFriendlyError } from "@/utlis/errorTranslator";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function createSubjects(data) {
  console.log("Data to insert:", data);
  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      error: "Cannot submit: No subject rows were added.",
    };
  }
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) return auth;

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
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred while saving subjects.",
      ),
    };
  }
}

export async function updateSubject(id, updatedFields) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) return auth;

    const payload = {
      subject_code: updatedFields.subject_code,
      subject_name: updatedFields.subject_name,
    };

    const { data, error } = await supabase
      .from("subjects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subject:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to update subject."),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating subject:", error);
    return {
      success: false,
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred while updating subject.",
      ),
    };
  }
}

export async function deleteSubject(id) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) return auth;

    const { error } = await supabase.from("subjects").delete().eq("id", id);

    if (error) {
      console.error("Error deleting subject:", error);
      return {
        success: false,
        error: getUserFriendlyError(error, "Failed to delete subject."),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting subject:", error);
    return {
      success: false,
      error: getUserFriendlyError(
        error,
        "An unexpected error occurred while deleting subject.",
      ),
    };
  }
}

export async function getSubjects(batchId = null) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin", "hod", "faculty"]);
    if (!auth.success) return auth;

    let subjectIds = null;
    if (batchId !== null && batchId !== undefined) {
      const { data: allocations, error: allocationError } = await supabase
        .from("faculty_allocations")
        .select("subject_id")
        .eq("batch_id", batchId);

      if (allocationError) {
        console.error(
          "Error fetching allocated subjects:",
          allocationError.message,
        );
        return { success: false, error: allocationError.message };
      }

      subjectIds = [
        ...new Set(
          (allocations || []).map((allocation) => allocation.subject_id),
        ),
      ];

      if (subjectIds.length === 0) {
        return { success: true, data: [] };
      }
    }

    let subjectQuery = supabase
      .from("subjects")
      .select("id,subject_name,subject_code");

    if (subjectIds) {
      subjectQuery = subjectQuery.in("id", subjectIds);
    }

    const { data: subject, error } = await subjectQuery;
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

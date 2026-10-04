"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function getBatchStudents(batchId, batch_group) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["faculty", "hod", "admin"]);
    if (!auth.success) return auth;

    let enrollment = null;
    let enrollmentError = null;
    if (batch_group) {
      ({ data: enrollment, error: enrollmentError } = await supabase
        .from("student_batches")
        .select(
          "batch_group, students(id, name, c_roll_number, u_roll_number, phone, email, parent_name)",
        )
        .eq("batch_id", batchId)
        .eq("batch_group", batch_group));
    } else {
      ({ data: enrollment, error: enrollmentError } = await supabase
        .from("student_batches")
        .select(
          "batch_group, students(id, name, c_roll_number, u_roll_number, phone, email, parent_name)",
        )
        .eq("batch_id", batchId));
    }

    if (enrollmentError) {
      console.error("Error fetching students:", enrollmentError);
      return {
        success: false,
        error: "Failed to fetch students from the database.",
      };
    }
    // 3. Format the data perfectly for your frontend
    let formattedStudents = enrollment.map((record) => ({
      id: record.students.id,
      c_roll_number: record.students.c_roll_number,
      u_roll_number: record.students.u_roll_number,
      name: record.students.name,
      phone: record.students.phone,
      email: record.students.email,
      parent_name: record.students.parent_name,
      batch_group: record.batch_group || null,
    }));

    return {
      success: true,
      data: formattedStudents,
    };
  } catch (error) {
    console.error("Error fetching students:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching students.",
    };
  }
}

"use server";

import { createClient } from "@/utlis/supabase/server";

export async function fetchStudent(batchId) {
  try {
    const supabase = await createClient();
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("student_batches")
      .select("students(id, name, c_roll_number, u_roll_number)")
      .eq("batch_id", batchId);
      // .eq("status", "active");

    if (enrollmentError) {
      console.error("Error fetching students:", enrollmentError);
      return {
        success: false,
        error: "Failed to fetch students from the database.",
      };
    }
    // 3. Format the data perfectly for your frontend
    const formattedStudents = enrollment.map((record) => ({
      id: record.students.id,
      c_roll_number: record.students.c_roll_number,
      u_roll_number: record.students.u_roll_number,
      name: record.students.name,
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

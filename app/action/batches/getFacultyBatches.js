"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUser } from "../auth/getUser";

export async function getFacultyBatches() {
  try {
    const supabase = await createClient();
    const user = await getUser(["faculty", "hod"]);
    const { data: facultyData, error: facultyError } = await supabase
      .from("faculty")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (facultyError) {
      console.error("Error fetching faculty data:", facultyError);
      return {
        success: false,
        error: "An unexpected error occurred while fetching faculty data.",
      };
    }

    if (!facultyData) {
      console.error("Faculty not found for the current user.");
      return {
        success: false,
        error: "Faculty not found for the current user.",
      };
    }

    const facultyId = facultyData.id;
    const { data: allocations, error } = await supabase
      .from("faculty_allocations")
      .select(
        `
        id,
        batch_group,
        batches ( id, batch_code, session_year, semester, department_id, course,status, departments(id, s_name) ),
        subjects ( id, subject_name, subject_code )
      `,
      )
      .eq("faculty_id", facultyId);
    if (error) throw error;

    // 3. Format the data for the frontend
    const formattedBatches = allocations
      .filter((record) => record.batches)
      .map((record) => ({
        id: record.id,
        batch_id: record.batches.id,
        batch_code: record.batches.batch_code,
        session_year: record.batches.session_year,
        batch_status: record.batches.status,
        batch_group: record.batch_group || null,
        semester: record.batches.semester,
        course: record.batches.course,
        branch: record.batches.departments?.s_name || "",
        subject_id: record.subjects.id,
        subject_name: record.subjects.subject_name,
        subject_code: record.subjects.subject_code,
      }));
    // console.log(formattedBatches)
    return { success: true, data: formattedBatches };
  } catch (error) {
    console.error("Error fetching batches:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching batches.",
    };
  }
}

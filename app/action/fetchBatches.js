"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUser } from "./getUser";

export async function fetchBatches() {
  try {
    const supabase = await createClient();
    const user = await getUser();
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
        batches ( id, batch_code, semester, branch, course ),
        subjects ( id, subject_name, subject_code )
      `,
      )
      .eq("faculty_id", facultyId);
    if (error) throw error;

    // 3. Format the data for the frontend
    const formattedBatches = allocations.map((record) => ({
      id: record.id,
      batch_id: record.batches.id,
      batch_code: record.batches.batch_code,
      semester: record.batches.semester,
      course: record.batches.course,
      subject_id: record.subjects.id,
      subject_name: record.subjects.subject_name,
      subject_code: record.subjects.subject_code,
      // We will calculate the REAL percentage in the next step!
      // For now, let's put a random number between 50 and 100 just to test the UI.
      attendancePercent: Math.floor(Math.random() * 50) + 50,
    }));

    return { success: true, data: formattedBatches };
  } catch (error) {
    console.error("Error fetching batches:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching batches.",
    };
  }
}

"use server";

import { createClient } from "@/utlis/supabase/server";

export async function submitFacultyAllocation(data) {
  console.log("Data to insert:", data);
  // return { success: true, message: "Data inserted successfully" };
  try {
    const supabase = await createClient();
    // const formatData = data.map((item) => ({
    //   faculty_id: item.facultyId,
    //   batch_id: item.batchId,
    //   subject_id: item.subjectId,
    // }));
    const { error } = await supabase.from("faculty_allocations").insert(data);

    if (error) {
      console.error("Error inserting data:", error);
      return { success: false, error };
    }
    console.log("Faculty allocation data inserted successfully");
    return { success: true, message: "Data inserted successfully" };
  } catch (error) {
    console.error("Error inserting data:", error);
    return { success: false, error };
  }
}

"use server";

import { createClient } from "@/utlis/supabase/server";

export async function submitBatches(data) {
  // console.log("Data to insert:", data);
  const formatData = data.map((item) => ({
    batch_code: item.batch_code,
    session_year: item.session_year,
    semester: parseInt(item.semester),
    branch: item.branch,
    course: item.course,
    room_no: item.room_no,
  }));
  console.log("Formatted Data:", formatData);
  // return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("batches").insert(formatData);
    if (error) {
      throw new Error(error.message);
    }
    console.log("Batches submitted successfully");
  } catch (error) {
    console.error("Error submitting batches:", error.message);
  }
}

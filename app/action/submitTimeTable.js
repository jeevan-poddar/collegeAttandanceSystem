"use server";

import { createClient } from "@/utlis/supabase/server";

export async function submitTimeTable(data) {
  const formatData = data.map((item) => ({
    batch_id: item.batch_id,
    subject_id: item.subject_id,
    faculty_id: item.faculty_id,
    day_of_week: item.day_of_week,
    period_number: parseInt(item.period_number),
    room_no: item.room_no,
  }));
  console.log("Formatted Data:", formatData);
//   return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("timetable_master").insert(formatData);
    if (error) {
      throw new Error(error.message);
    }
    console.log("Timetable submitted successfully");
  } catch (error) {
    console.error("Error submitting timetable:", error.message);
  }
}

"use server";

import { createClient } from "@/utlis/supabase/server";
import { getUser } from "./getUser";
import { getUserFriendlyError } from "@/utlis/errorTranslator";

async function getBatchesAndAllocationsForStudent(supabase, student) {
  const { data: enrollmentData, error: enrollError } = await supabase
    .from("student_batches")
    .select(`
      batch_id,
      batch_group,
      batches (
        id, batch_code, session_year, semester, branch, course, room_no, status
      )
    `)
    .eq("student_id", student.id);

  if (enrollError) {
    return {
      success: false,
      error: getUserFriendlyError(
        enrollError,
        "Failed to load enrolled academic batches from database.",
      ),
    };
  }

  const batches = (enrollmentData || [])
    .filter((record) => record.batches)
    .map((record) => ({
      ...record.batches,
      student_group: record.batch_group || null,
    }));

  const batchIds = batches.map((b) => b.id);
  let formattedAllocations = [];

  if (batchIds.length > 0) {
    const studentGroupMap = new Map();
    for (const b of batches) {
      studentGroupMap.set(Number(b.id), b.student_group);
    }

    const { data: allocData, error: allocError } = await supabase
      .from("faculty_allocations")
      .select(`
        id,
        batch_id,
        subject_id,
        batch_group,
        subjects (id, subject_name, subject_code),
        faculty (id, name, email)
      `)
      .in("batch_id", batchIds);

    if (!allocError && allocData) {
      formattedAllocations = allocData
        .map((alloc) => ({
          id: alloc.id,
          batch_id: alloc.batch_id,
          subject_id: alloc.subject_id,
          batch_group: alloc.batch_group || null,
          subject_name: alloc.subjects?.subject_name || `Subject #${alloc.subject_id}`,
          subject_code: alloc.subjects?.subject_code || "N/A",
          faculty_name: alloc.faculty?.name || "Assigned Faculty",
          faculty_email: alloc.faculty?.email || "",
        }))
        .filter((alloc) => {
          const studentGroup = studentGroupMap.get(Number(alloc.batch_id));
          if (!studentGroup || studentGroup === "ALL" || studentGroup === "All" || studentGroup === "") {
            return true; // Student is not restricted to a subgroup, so show all subjects
          }
          const allocGroup = alloc.batch_group;
          return !allocGroup || allocGroup === "ALL" || allocGroup === "All" || allocGroup === "" || allocGroup === studentGroup;
        });
    }
  }

  return {
    success: true,
    data: {
      student,
      batches,
      allocations: formattedAllocations,
    },
  };
}

export async function fetchStudentDashboardData() {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in as an active student to view your academic records.",
      };
    }

    let { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!student && user.email) {
      const { data: studentByEmail } = await supabase
        .from("students")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      if (studentByEmail) {
        student = studentByEmail;
      }
    }

    if (!student) {
      return {
        success: false,
        error: "No registered student profile found associated with your account.",
      };
    }

    return await getBatchesAndAllocationsForStudent(supabase, student);
  } catch (error) {
    console.error("Error fetching student dashboard data:", error);
    return {
      success: false,
      error: "An unexpected network error occurred while loading your academic dashboard. Please refresh.",
    };
  }
}

export async function fetchStudentDashboardById(studentId) {
  try {
    const supabase = await createClient();
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError) {
      return {
        success: false,
        error: getUserFriendlyError(
          studentError,
          "Failed to locate student profile in database.",
        ),
      };
    }

    if (!student) {
      return {
        success: false,
        error: "Student profile could not be found with the provided identifier.",
      };
    }

    return await getBatchesAndAllocationsForStudent(supabase, student);
  } catch (error) {
    console.error("Error fetching student dashboard by ID:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching student dashboard records.",
    };
  }
}

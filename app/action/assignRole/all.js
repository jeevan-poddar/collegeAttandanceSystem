"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

export async function fetchDepartments() {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const { data, error } = await supabase
      .from("departments")
      .select("id,s_name");
    if (error) {
      throw new Error("Error fetching departments: " + error.message);
    }
    // console.log("Fetched departments:", data);
    return { success: true, departments: data };
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    return { success: false, error: error.message };
  }
}

export async function fetchUnkownUsers(duration) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }
    const date = new Date();
    date.setDate(date.getDate() - duration);
    const { data, error } = await supabase
      .from("users")
      .select("id,full_name,email")
      .eq("role", "unknown")
      .gt("created_at", date.toISOString());

    if (error) {
      throw new Error("Error fetching unknown users: " + error.message);
    }

    // console.log("Fetched unknown users:", data);
    return { success: true, unknownUsers: data };
  } catch (error) {
    console.error("Error fetching unknown users:", error.message);
    return { success: false, error: error.message };
  }
}

export async function submitStudentAndUpdateUserRole(data = []) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }
    const userId = data.map((item) => item.user_id);

    const roleData = data[0]?.role;
    // console.log("Role data:", roleData);

    if (!roleData) {
      throw new Error("Role data is missing in the input.");
    }
    const { error } = await supabase
      .from("users")
      .update({ role: roleData })
      .in("id", userId);
    if (error) {
      throw new Error("Error updating user roles: " + error.message);
    }

    if (roleData === "student") {
      const dataToInsert = data.map((item) => ({
        user_id: item.user_id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        parent_name: item.parentName,
        c_roll_number: item.cRollNo,
        u_roll_number: item.cRollNo,
        department_id: item.department_id,
        parent_phone: item.parentPhone,
        session_year: item.sessionYear,
      }));
      const { error: insertError } = await supabase
        .from("students")
        .upsert(dataToInsert, { onConflict: "user_id" });
      if (insertError) {
        throw new Error("Error inserting students: " + insertError.message);
      }
    } else if (roleData === "faculty") {
      const dataToInsert = data.map((item) => ({
        user_id: item.user_id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        department_id: item.department_id,
      }));
      const { error: insertError } = await supabase
        .from("faculty")
        .upsert(dataToInsert, { onConflict: "user_id" });
      if (insertError) {
        throw new Error("Error inserting faculty: " + insertError.message);
      }
    } else if (roleData === "hod") {
      const dataToInsert = data.map((item) => ({
        user_id: item.user_id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        department_id: item.department_id,
      }));
      // console.log("HOD data to insert:", dataToInsert);
      const { error: insertError } = await supabase
        .from("hod")
        .insert(dataToInsert);
      if (insertError) {
        throw new Error("Error inserting hod: " + insertError.message);
      }
      const { error: insertError2 } = await supabase
        .from("faculty")
        .upsert(dataToInsert, { onConflict: "user_id" });
      if (insertError2) {
        throw new Error("Error inserting faculty: " + insertError2.message);
      }
    }

    return { success: true, submitStudentAndUpdateUserRole: data };
  } catch (error) {
    console.error(
      "Error submitting Student And Update User Role:",
      error.message,
    );
    return { success: false, error: error.message };
  }
}

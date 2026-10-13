"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

const PAGE_SIZE = 20;

/**
 * Fetch users who have been assigned a role (role != 'unknown'),
 * with optional filtering by role and search text, plus pagination.
 */
export async function fetchAssignedUsers({
  role = "all",
  search = "",
  page = 1,
} = {}) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Build the base query for users with assigned roles
    let query = supabase
      .from("users")
      .select("id, full_name, email, role, created_at", { count: "exact" })
      .neq("role", "unknown")
      .order("created_at", { ascending: false })
      .range(from, to);

    // Apply role filter
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    // Apply search filter (name or email)
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error("Error fetching assigned users: " + error.message);
    }

    // For each user, fetch their department from the role-specific table
    const usersWithDetails = await Promise.all(
      (data || []).map(async (user) => {
        const details = await fetchRoleTableInfo(supabase, user.id, user.role);
        return {
          ...user,
          department_name: details?.department_name || null,
          phone: details?.phone || null,
          roleTableId: details?.id || null,
        };
      }),
    );

    return {
      success: true,
      users: usersWithDetails,
      totalCount: count || 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((count || 0) / PAGE_SIZE),
    };
  } catch (error) {
    console.error("Error fetching assigned users:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper: fetch basic info from the role-specific table for list display.
 */
async function fetchRoleTableInfo(supabase, userId, role) {
  try {
    let tableName;
    if (role === "student") tableName = "students";
    else if (role === "faculty") tableName = "faculty";
    else if (role === "hod") tableName = "faculty"; // HOD data lives in faculty too
    else return null;

    const { data, error } = await supabase
      .from(tableName)
      .select("id, phone, department_id, departments(s_name)")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      phone: data.phone,
      department_name: data.departments?.s_name || null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch full role-specific details for a single user (for the edit form).
 */
export async function fetchUserRoleDetails(userId) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Fetch the user record first
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error("User not found.");
    }

    let roleDetails = null;
    const role = user.role;

    if (role === "student") {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, name, email, phone, parent_name, c_roll_number, u_roll_number, department_id, parent_phone, session_year, departments(id, s_name)",
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (!error && data) roleDetails = data;
    } else if (role === "faculty" || role === "hod") {
      const { data, error } = await supabase
        .from("faculty")
        .select(
          "id, name, email, phone, department_id, departments(id, s_name)",
        )
        .eq("user_id", userId)
        .maybeSingle();
      if (!error && data) roleDetails = data;

      // If HOD, also fetch the hod record
      if (role === "hod") {
        const { data: hodData } = await supabase
          .from("hod")
          .select("id, department_id, name, email, phone")
          .eq("user_id", userId)
          .maybeSingle();
        if (hodData) {
          roleDetails = {
            ...roleDetails,
            ...hodData,
            hodRecord: hodData,
          };
        }
      }
    }

    return {
      success: true,
      user,
      roleDetails,
    };
  } catch (error) {
    console.error("Error fetching user role details:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch departments list (needed for edit dropdowns).
 */
export async function fetchDepartmentsForEdit() {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const { data, error } = await supabase
      .from("departments")
      .select("id, s_name");
    if (error) {
      throw new Error("Error fetching departments: " + error.message);
    }
    return { success: true, departments: data };
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update role-specific fields for a user.
 * Does NOT change the user's role — only metadata in the role table.
 */
export async function updateUserRoleDetails(userId, role, updates) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    if (role === "student") {
      const allowedFields = [
        "name",
        "email",
        "phone",
        "parent_name",
        "c_roll_number",
        "u_roll_number",
        "department_id",
        "parent_phone",
        "session_year",
      ];
      const filtered = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) filtered[key] = updates[key];
      }

      const { error } = await supabase
        .from("students")
        .update(filtered)
        .eq("user_id", userId);
      if (error) {
        throw new Error("Error updating student details: " + error.message);
      }
    } else if (role === "faculty" || role === "hod") {
      const allowedFields = ["name", "email", "phone", "department_id"];
      const filtered = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) filtered[key] = updates[key];
      }

      const { error } = await supabase
        .from("faculty")
        .update(filtered)
        .eq("user_id", userId);
      if (error) {
        throw new Error("Error updating faculty details: " + error.message);
      }

      if (role === "hod") {
        const { data: hodRecord, error: hodFetchError } = await supabase
          .from("hod")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (hodFetchError) {
          throw new Error(
            "Error finding HOD details: " + hodFetchError.message,
          );
        }
        if (!hodRecord) {
          throw new Error("HOD details were not found for this user.");
        }

        const { error: hodUpdateError } = await supabase
          .from("hod")
          .update(filtered)
          .eq("id", hodRecord.id);
        if (hodUpdateError) {
          throw new Error(
            "Error updating HOD details: " + hodUpdateError.message,
          );
        }
      }
    }

    // Also update full_name on the users table if name changed
    if (updates.name !== undefined) {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ full_name: updates.name })
        .eq("id", userId);
      if (userUpdateError) {
        throw new Error(
          "Error updating user name: " + userUpdateError.message,
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user role details:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke / change a user's role.
 * - For HOD: deletes hod row only, keeps faculty row.
 * - For Student: deletes student row data.
 * - For all other roles: no deletion, data preserved in role tables.
 * - Upserts new role data if the user is changing to a role that requires it.
 * - Updates users.role to newRole.
 */
export async function revokeUserRole(
  userId,
  currentRole,
  newRole = "unknown",
  roleData = null
) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["admin"]);
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Fetch user basic details for fallback names
    const { data: user } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    // For HOD: delete the hod record (faculty row preserved)
    if (currentRole === "hod" && newRole !== "hod") {
      const { error: hodError } = await supabase
        .from("hod")
        .delete()
        .eq("user_id", userId);
      if (hodError) {
        throw new Error("Error removing HOD record: " + hodError.message);
      }
    }

    // For Student: delete the student record
    if (currentRole === "student" && newRole !== "student") {
      const { error: studentError } = await supabase
        .from("students")
        .delete()
        .eq("user_id", userId);
      if (studentError) {
        throw new Error(
          "Error removing student record: " + studentError.message
        );
      }
    }

    // Handle new role data upsert if provided
    if (roleData && Object.keys(roleData).length > 0) {
      if (newRole === "faculty" || newRole === "hod") {
        const facultyPayload = {
          user_id: userId,
          name: roleData.name || user?.full_name,
          email: roleData.email || user?.email,
          phone: roleData.phone,
          department_id: roleData.department_id,
        };
        const { error: fErr } = await supabase
          .from("faculty")
          .upsert(facultyPayload, { onConflict: "user_id" });
        if (fErr)
          throw new Error("Error updating faculty data: " + fErr.message);

        if (newRole === "hod") {
          const { data: existingHod, error: hErr } = await supabase
            .from("hod")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
          if (hErr)
            throw new Error("Error updating HOD data: " + hErr.message);

          if (existingHod) {
            const { error: updateHodError } = await supabase
              .from("hod")
              .update({
                name: facultyPayload.name,
                email: facultyPayload.email,
                phone: facultyPayload.phone,
                department_id: facultyPayload.department_id,
              })
              .eq("id", existingHod.id);
            if (updateHodError) {
              throw new Error(
                "Error updating HOD data: " + updateHodError.message,
              );
            }
          } else {
            const { error: insertHodError } = await supabase
              .from("hod")
              .insert(facultyPayload);
            if (insertHodError) {
              throw new Error(
                "Error inserting HOD data: " + insertHodError.message,
              );
            }
          }
        }
      } else if (newRole === "student") {
        const studentPayload = {
          user_id: userId,
          name: roleData.name || user?.full_name,
          email: roleData.email || user?.email,
          phone: roleData.phone,
          department_id: roleData.department_id,
          parent_name: roleData.parent_name,
          parent_phone: roleData.parent_phone,
          c_roll_number: roleData.c_roll_number,
          u_roll_number: roleData.c_roll_number, // Default to same as c_roll_number
          session_year: roleData.session_year,
        };
        const { error: sErr } = await supabase
          .from("students")
          .upsert(studentPayload, { onConflict: "user_id" });
        if (sErr)
          throw new Error("Error updating student data: " + sErr.message);
      }
    }

    // Update the user's role
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      throw new Error("Error updating user role: " + error.message);
    }

    return { success: true };
  } catch (error) {
    console.error("Error revoking user role:", error.message);
    return { success: false, error: error.message };
  }
}

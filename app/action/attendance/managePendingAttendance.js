"use server";

import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

const APPROVER_ROLES = ["faculty", "hod"];

function normalizeAttendanceIds(attendanceIds) {
  if (!Array.isArray(attendanceIds)) return [];

  return [...new Set(
    attendanceIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0),
  )];
}

async function getSessionApprover(supabase, sessionId, auth) {
  const normalizedSessionId = Number(sessionId);
  if (!Number.isInteger(normalizedSessionId) || normalizedSessionId <= 0) {
    return { success: false, error: "A valid session ID is required." };
  }

  const { data: session, error: sessionError } = await supabase
    .from("class_sessions")
    .select("id, faculty_id")
    .eq("id", normalizedSessionId)
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Class session was not found." };
  }

  if (auth.userRole === "hod") {
    return { success: true, sessionId: normalizedSessionId, facultyId: session.faculty_id };
  }

  const { data: faculty, error: facultyError } = await supabase
    .from("faculty")
    .select("id")
    .eq("user_id", auth.userId)
    .single();

  if (facultyError || !faculty || faculty.id !== session.faculty_id) {
    return { success: false, error: "You are not allowed to approve this session's attendance." };
  }

  return { success: true, sessionId: normalizedSessionId, facultyId: faculty.id };
}

async function authorizeSessionApprover(sessionId) {
  const supabase = await createClient();
  const auth = await getAuthClaims(supabase, APPROVER_ROLES);
  if (!auth.success) return { ...auth, supabase: null };

  const access = await getSessionApprover(supabase, sessionId, auth);
  return { ...access, supabase };
}

export async function fetchPendingAttendance(sessionId) {
  try {
    const authorization = await authorizeSessionApprover(sessionId);
    if (!authorization.success) return authorization;

    const { data, error } = await authorization.supabase
      .from("attendance")
      .select("id, student_id, status, marked_at, students ( id, name, c_roll_number, u_roll_number )")
      .eq("class_session_id", authorization.sessionId)
      .eq("is_verified", false)
      .order("marked_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data ?? [] };
  } catch (error) {
    console.error("Unable to fetch pending attendance:", error);
    return { success: false, error: "Unable to fetch pending attendance." };
  }
}

export async function approvePendingAttendance(sessionId, attendanceIds) {
  try {
    const ids = normalizeAttendanceIds(attendanceIds);
    if (ids.length === 0) {
      return { success: false, error: "Select at least one attendance submission." };
    }

    const authorization = await authorizeSessionApprover(sessionId);
    if (!authorization.success) return authorization;

    const { data, error } = await authorization.supabase
      .from("attendance")
      .update({ is_verified: true, marked_by: authorization.facultyId })
      .eq("class_session_id", authorization.sessionId)
      .eq("is_verified", false)
      .in("id", ids)
      .select("id");

    if (error) return { success: false, error: error.message };
    return { success: true, count: data?.length ?? 0, data: data ?? [] };
  } catch (error) {
    console.error("Unable to approve attendance:", error);
    return { success: false, error: "Unable to approve attendance submissions." };
  }
}

export async function rejectPendingAttendance(sessionId, attendanceIds) {
  try {
    const ids = normalizeAttendanceIds(attendanceIds);
    if (ids.length === 0) {
      return { success: false, error: "Select at least one attendance submission." };
    }

    const authorization = await authorizeSessionApprover(sessionId);
    if (!authorization.success) return authorization;

    const { data, error } = await authorization.supabase
      .from("attendance")
      .delete()
      .eq("class_session_id", authorization.sessionId)
      .eq("is_verified", false)
      .in("id", ids)
      .select("id");

    if (error) return { success: false, error: error.message };
    return { success: true, count: data?.length ?? 0, data: data ?? [] };
  } catch (error) {
    console.error("Unable to reject attendance:", error);
    return { success: false, error: "Unable to reject attendance submissions." };
  }
}

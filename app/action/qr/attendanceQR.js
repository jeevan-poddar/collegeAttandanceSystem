"use server";
import nacl from "tweetnacl";
import { decodeUTF8, encodeBase64, decodeBase64 } from "tweetnacl-util";
import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "../auth/getAuthClaims";

// Load the secret key from environment variables
const SECRET_KEY = decodeBase64(process.env.ENCRYPTION_KEY);

export async function generateAttendanceToken(sessionId) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["faculty", "hod"]);
    if (!auth.success) return auth;

    const normalizedSessionId = Number(sessionId);
    if (!Number.isInteger(normalizedSessionId) || normalizedSessionId <= 0) {
      return { success: false, error: "A valid session ID is required." };
    }

    if (auth.userRole === "faculty") {
      const { data: faculty, error: facultyError } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", auth.userId)
        .single();
      if (facultyError || !faculty) {
        return { success: false, error: "Faculty profile not found." };
      }
      const { data: session, error: sessionError } = await supabase
        .from("class_sessions")
        .select("id")
        .eq("id", normalizedSessionId)
        .eq("actual_faculty_id", faculty.id)
        .single();
      if (sessionError || !session) {
        return {
          success: false,
          error: "You are not allowed to generate a QR code for this session.",
        };
      }
    }

    // 1. Create the payload with the current timestamp (crucial for freshness check!)
    const payload = {
      s: normalizedSessionId,
      t: Date.now(),
    };

    // 2. Encrypt it using NaCl
    const messageBytes = decodeUTF8(JSON.stringify(payload));
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(messageBytes, nonce, SECRET_KEY);

    // 3. Package nonce + encrypted data into a single Base64 string
    const fullPackage = new Uint8Array(nonce.length + encrypted.length);
    fullPackage.set(nonce);
    fullPackage.set(encrypted, nonce.length);

    const encryptedString = encodeBase64(fullPackage);

    return { success: true, token: encryptedString };
  } catch (error) {
    return { success: false, error: "Failed to generate security token" };
  }
}

export async function verifyAndMarkAttendance(encryptedToken) {
  try {
    const supabase = await createClient();
    const auth = await getAuthClaims(supabase, ["student"]);
    if (!auth.success) return auth;

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", auth.userId)
      .single();
    if (studentError || !student) {
      return { success: false, error: "Student profile not found." };
    }

    // 1. DECRYPT THE TOKEN
    const fullPackage = decodeBase64(encryptedToken);
    const nonce = fullPackage.slice(0, nacl.secretbox.nonceLength);
    const encrypted = fullPackage.slice(nacl.secretbox.nonceLength);

    const decryptedBytes = nacl.secretbox.open(encrypted, nonce, SECRET_KEY);

    // If decryption fails, someone tampered with it or made a fake QR code!
    if (!decryptedBytes) {
      return { success: false, error: "Invalid or forged QR code!" };
    }

    // 2. READ THE PAYLOAD
    const messageString = new TextDecoder().decode(decryptedBytes);
    const payload = JSON.parse(messageString);
    const { s, t } = payload;
    console.log("Decrypted payload:", payload);
    console.log("sessionId:", s, "timestamp:", t);

    // 3. FRESHNESS CHECK (Anti-WhatsApp Attack)
    const ageInMs = Date.now() - t;
    const MAX_AGE_MS = 30000; // 30 seconds threshold (gives a safe buffer over the 15s refresh)

    if (ageInMs > MAX_AGE_MS || ageInMs < 0) {
      return {
        success: false,
        error: "QR code has expired! Please scan the live code on screen.",
      };
    }
    console.log("Data to insert into attendance table:", {
      class_session_id: s,
      student_id: student.id,
    });

    // 4. INSERT PENDING ATTENDANCE INTO SUPABASE
    const { error: insertError } = await supabase.from("attendance").insert({
      class_session_id: s,
      student_id: student.id,
    });

    if (insertError) {
      console.error("Failed to insert QR attendance:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });

      // Catch duplicate scans (Unique constraint on class_session_id + student_id)
      if (insertError.code === "23505") {
        return {
          success: false,
          error: "You have already submitted attendance for this class.",
        };
      }
      return {
        success: false,
        error: `Database error saving attendance: ${insertError.message}`,
      };
    }

    return {
      success: true,
      message: "Attendance submitted! Waiting for teacher approval.",
    };
  } catch (err) {
    console.error("Error processing attendance scan:", err);
    return { success: false, error: "Failed to process attendance scan." };
  }
}

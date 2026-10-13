"use server";
import nacl from "tweetnacl";
import { decodeUTF8, encodeBase64, decodeBase64 } from "tweetnacl-util";

// Load the secret key from environment variables
const SECRET_KEY = decodeBase64(process.env.ENCRYPTION_KEY);

export async function generateAttendanceToken(sessionId) {
  try {
    // 1. Create the payload with the current timestamp (crucial for freshness check!)
    const payload = {
      sessionId: sessionId,
      timestamp: Date.now(),
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








export async function verifyAndMarkAttendance(encryptedToken, studentId) {
  try {
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
    const { sessionId, timestamp } = payload;

    // 3. FRESHNESS CHECK (Anti-WhatsApp Attack)
    const ageInMs = Date.now() - timestamp;
    const MAX_AGE_MS = 30000; // 30 seconds threshold (gives a safe buffer over the 15s refresh)

    if (ageInMs > MAX_AGE_MS) {
      return {
        success: false,
        error: "QR code has expired! Please scan the live code on screen.",
      };
    }

    // 4. INSERT PENDING ATTENDANCE INTO SUPABASE
    const supabase = createClient();

    const { error: insertError } = await supabase.from("attendance").insert({
      class_session_id: sessionId,
      student_id: studentId,
      status: "pending", // Waiting for the teacher to accept!
      marked_by: null, // Will be updated when the teacher accepts
      is_verified: false, // New column to track verification status
    });

    if (insertError) {
      // Catch duplicate scans (Unique constraint on class_session_id + student_id)
      if (insertError.code === "23505") {
        return {
          success: false,
          error: "You have already submitted attendance for this class.",
        };
      }
      return { success: false, error: "Database error saving attendance." };
    }

    return {
      success: true,
      message: "Attendance submitted! Waiting for teacher approval.",
    };
  } catch (err) {
    return { success: false, error: "Failed to process attendance scan." };
  }
}

"use server";
import { createClient } from "@/utlis/supabase/server";
export async function refreshToken() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Token refresh failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("JWT refreshed successfully");
    return { success: true };
  } catch (error) {
    console.error(
      "An error occurred while refreshing the token:",
      error.message,
    );
    return { success: false, error: error.message };
  }
}

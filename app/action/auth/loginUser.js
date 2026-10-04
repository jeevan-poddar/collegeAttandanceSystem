"use server";

import { createClient } from "@/utlis/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginUser(userData) {
  try {
    const supabase = await createClient();
    const { data: user, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password,
    });

    if (error) {
      throw new Error(error.message);
    }
    console.log("User logged in successfully");
  } catch (error) {
    console.log("Error logging in user:", error);
    return { success: false, error: error.message };
  }
  revalidatePath("/", "layout");
  redirect("/");

  return { success: true };
}

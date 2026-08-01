"use server";

import { createClient } from "@/utlis/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUser(userData) {
  try {
    const supabase = await createClient();
    const { data: user, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
    console.log("User created successfully:");
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
  revalidatePath("/", "layout");
  redirect("/");

  return { success: true };
}

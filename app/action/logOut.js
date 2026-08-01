"use server";

import { createClient } from "@/utlis/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logOut() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
  } catch (error) {
    console.error("Error logging out:", error.message);
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

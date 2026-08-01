"use server";
import { createClient } from "@/utlis/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (user) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.log("Error fetching user data: ", userError.message);
      return null;
    }
    return userData;
  }
  if (error) {
    console.log("Error fetching user: ", error.message);
    return null;
  }
}

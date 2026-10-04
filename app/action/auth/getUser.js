"use server";
import { createClient } from "@/utlis/supabase/server";
import { getAuthClaims } from "./getAuthClaims";

export async function getUser(allowedRoles = []) {
  const supabase = await createClient();
  const auth = await getAuthClaims(supabase, allowedRoles);

  if (!auth.success) {
    return null;
  }

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

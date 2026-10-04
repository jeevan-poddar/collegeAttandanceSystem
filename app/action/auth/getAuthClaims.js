"use server";

export async function getAuthClaims(supabase, allowedRoles = []) {
  const {
    data,
    error,
  } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const userRole = claims.user_role;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  return {
    success: true,
    claims,
    userId: claims.sub,
    userRole,
  };
}

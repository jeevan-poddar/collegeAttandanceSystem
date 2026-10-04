export async function callWithRole(role, allowedRoles, action, ...args) {
  if (!allowedRoles.includes(role?.toLowerCase())) {
    return {
      success: false,
      error: "You are not authorized to perform this action.",
    };
  }

  return action(...args);
}

export function getUserFriendlyError(error, defaultMessage = "An unexpected error occurred while saving your data. Please try again later.") {
  if (!error) return defaultMessage;

  const msg = (typeof error === "string" ? error : (error.message || error.details || error.hint || "")).toLowerCase();
  const code = error.code ? String(error.code) : "";

  // 1. Network / Offline / Connection errors
  if (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("connection") ||
    msg.includes("econnrefused") ||
    msg.includes("offline") ||
    msg.includes("timeout") ||
    msg.includes("fetch failed")
  ) {
    return "Network connection error. Please check your internet connection and try again.";
  }

  // 2. Duplicate / Already exists (Postgres SQL 23505)
  if (
    code === "23505" ||
    msg.includes("duplicate key") ||
    msg.includes("already exists") ||
    msg.includes("unique constraint") ||
    msg.includes("duplicate")
  ) {
    return "This record already exists in the database (duplicate value). Please ensure your codes and values are unique.";
  }

  // 3. Empty / Null row / Required field missing
  if (
    code === "23502" ||
    msg.includes("null value in column") ||
    msg.includes("violates not-null constraint") ||
    msg.includes("empty row") ||
    msg.includes("required")
  ) {
    return "Cannot submit: One or more required fields are empty. Please fill in all required information.";
  }

  // 4. Foreign key / Reference error (Postgres SQL 23503)
  if (
    code === "23503" ||
    msg.includes("violates foreign key constraint") ||
    msg.includes("foreign key")
  ) {
    return "This record references related academic data (like a batch, subject, or student) that cannot be found or is actively linked elsewhere.";
  }

  // 5. Data Syntax / Format error
  if (
    msg.includes("invalid input syntax") ||
    msg.includes("out of range") ||
    msg.includes("nan") ||
    msg.includes("not an integer")
  ) {
    return "One or more values have an invalid format (e.g., text entered where a number was required). Please verify your entries.";
  }

  // Return formatted message if it looks clean, otherwise return default message
  if (msg.length > 5 && msg.length < 120 && !msg.includes("error") && !msg.includes("sql") && !msg.includes("postgres")) {
    return typeof error === "string" ? error : error.message;
  }

  return defaultMessage;
}

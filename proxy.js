import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function getDashboardByRole(role) {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "hod":
      return "/dashboard/hod";
    case "faculty":
      return "/dashboard/faculty";
    case "student":
      return "/dashboard/student";
    default:
      return "/";
  }
}

export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Retrieve authenticated user from Supabase session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboardPath = path.startsWith("/dashboard");
  const isAuthPath = path === "/login" || path === "/signUp";

  // 1. If user is unauthenticated and attempting to access a dashboard path, redirect to login
  if (!user && isDashboardPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If user is authenticated, check their assigned role in users table
  if (user) {
    let userRole = "unknown";
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!roleError && userData && userData.role) {
      userRole = userData.role.toLowerCase();
    }

    // Automatically redirect authenticated users away from login/signup pages to their portal
    if (isAuthPath) {
      const targetUrl = new URL(getDashboardByRole(userRole), request.url);
      return NextResponse.redirect(targetUrl);
    }

    // Automatically route general /dashboard requests to the user's specific role portal
    if (path === "/dashboard" || path === "/dashboard/") {
      const targetUrl = new URL(getDashboardByRole(userRole), request.url);
      return NextResponse.redirect(targetUrl);
    }

    // Enforce Role-Based Access Control (RBAC) on specific dashboard sections
    // Admin section: accessible strictly to 'admin'
    if (path.startsWith("/dashboard/admin")) {
      if (userRole !== "admin") {
        const fallbackUrl = new URL(getDashboardByRole(userRole), request.url);
        return NextResponse.redirect(fallbackUrl);
      }
    }

    // HOD section: accessible to 'hod' and 'admin'
    if (path.startsWith("/dashboard/hod")) {
      if (!["hod"].includes(userRole)) {
        const fallbackUrl = new URL(getDashboardByRole(userRole), request.url);
        return NextResponse.redirect(fallbackUrl);
      }
    }

    // Faculty section: accessible to 'faculty', 'hod', and 'admin'
    if (path.startsWith("/dashboard/faculty")) {
      if (!["faculty", "hod"].includes(userRole)) {
        const fallbackUrl = new URL(getDashboardByRole(userRole), request.url);
        return NextResponse.redirect(fallbackUrl);
      }
    }

    // Student section: accessible to all valid institutional roles
    if (path.startsWith("/dashboard/student")) {
      if (!["student"].includes(userRole)) {
        const fallbackUrl = new URL(getDashboardByRole(userRole), request.url);
        return NextResponse.redirect(fallbackUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
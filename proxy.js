import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const ROLE_DASHBOARDS = {
  admin: "/dashboard/admin",
  hod: "/dashboard/hod",
  faculty: "/dashboard/faculty",
  student: "/dashboard/student",
};

const PROTECTED_ROUTES = [
  { prefix: "/dashboard/admin", roles: ["admin"] },
  { prefix: "/dashboard/hod", roles: ["admin", "hod"] },
  { prefix: "/dashboard/faculty", roles: [ "hod", "faculty"] },
  { prefix: "/dashboard/student", roles: ["student"] },
];

const AUTH_ROUTES = new Set(["/login", "/signUp"]);

function getUserRole(claims) {
  return typeof claims?.user_role === "string"
    ? claims.user_role.toLowerCase()
    : null;
}

function getDashboardPath(role) {
  return ROLE_DASHBOARDS[role] ?? "/login";
}

function redirectTo(request, pathname, searchParams) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = searchParams ?? "";
  return NextResponse.redirect(url);
}

function getProtectedRoute(pathname) {
  return PROTECTED_ROUTES.find(({ prefix }) => pathname.startsWith(prefix));
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
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value, options);
          }

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = !error && Boolean(claims?.sub);
  const role = getUserRole(claims);
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname === "/dashboard" || pathname === "/dashboard/";
  const protectedRoute = getProtectedRoute(pathname);

  if (!isAuthenticated) {
    if (isDashboardRoute || protectedRoute) {
      const redirectToPath = `${pathname}${request.nextUrl.search}`;
      return redirectTo(request, "/login", `?redirectTo=${encodeURIComponent(redirectToPath)}`);
    }

    return response;
  }

  if (AUTH_ROUTES.has(pathname)) {
    if (!role) {
      return response;
    }

    return redirectTo(request, getDashboardPath(role));
  }

  if (isDashboardRoute) {
    return redirectTo(request, getDashboardPath(role));
  }

  if (protectedRoute && (!role || !protectedRoute.roles.includes(role))) {
    return redirectTo(request, getDashboardPath(role));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/utlis/supabase/server";

function resolveAppBaseUrl(requestOrigin) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const headerStore = headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return requestOrigin;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const baseUrl = resolveAppBaseUrl(origin);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("User authenticated successfully");
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  return NextResponse.redirect(
    `${baseUrl}/login?error=Could not authenticate with provider`,
  );
}

"use client";
import { createClient } from "@/utlis/supabase/client";
import React from "react";

const OAuthButton = () => {
  const supabase = createClient();
  const loginOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        // Tells Supabase exactly where to send the user after Google/GitHub validates them
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };
  return (
    <div className="w-full">
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-sm"
        onClick={() => loginOAuth("google")}
      >
        Login with Google
      </button>
    </div>
  );
};

export default OAuthButton;

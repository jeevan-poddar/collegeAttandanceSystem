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
    <div>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => loginOAuth("google")}
      >
        Login with Google
      </button>
    </div>
  );
};

export default OAuthButton;

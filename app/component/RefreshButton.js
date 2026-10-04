"use client";
import React from "react";
import { refreshToken } from "../action/auth/refreshToken";

const RefreshButton = () => {
  return (
    <div>
      <button onClick={refreshToken}>Refresh session</button>
    </div>
  );
};

export default RefreshButton;

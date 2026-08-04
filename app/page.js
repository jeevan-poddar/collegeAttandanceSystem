"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getUser } from "./action/getUser";

const home = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await getUser();
      if (response) {
        setUser(response);
      }
    };
    fetchUser();
  }, []);

  const renderRoleMessage = () => {
    if (user?.role === "faculty") {
      return "You are logged in as a faculty member.";
    } else if (user?.role === "student") {
      return "You are logged in as a student.";
    } else if (user?.role === "hod") {
      return "You are logged in as head of department.";
    } else if (user?.role === "admin") {
      return "You are logged in as an administrator.";
    } else {
      return "Your account role is currently unrecognized or unassigned.";
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
      <div className="w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Welcome, <span className="text-blue-600">{user?.full_name || "User"}</span>!
        </h1>
        <p className="text-sm md:text-base font-medium text-gray-600">
          {renderRoleMessage()}
        </p>
      </div>
    </div>
  );
};

export default home;

"use client";
import { BellRing } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getUser } from "../action/getUser";
import { logOut } from "../action/logOut";

const Navbar = () => {
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
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 md:px-10 flex items-center justify-between shadow-sm sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <span className="text-base font-bold text-gray-800 tracking-tight">Academic Dashboard</span>
      </div>
      <div className="flex items-center space-x-5">
        <button className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full transition relative hover:bg-gray-100">
          <BellRing className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-5">
          <p className="text-sm font-medium text-gray-800">Hello, <span className="font-semibold text-gray-900">{user?.full_name || "User"}</span>!</p>
          <span
            className={
              "text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-100 border " +
              (user?.role === "admin"
                ? "text-red-600 border-red-200 bg-red-50/60"
                : user?.role === "hod"
                  ? "text-yellow-600 border-yellow-200 bg-yellow-50/60"
                  : user?.role === "faculty"
                    ? "text-green-600 border-green-200 bg-green-50/60"
                    : user?.role === "student"
                      ? "text-blue-600 border-blue-200 bg-blue-50/60"
                      : "text-gray-600 border-gray-200")
            }
          >
            {user?.role || "Guest"}
          </span>
        </div>
        <button
          onClick={logOut}
          className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg transition shadow-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;

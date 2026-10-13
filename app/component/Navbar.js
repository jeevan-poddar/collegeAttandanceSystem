"use client";
import { BellRing, Menu } from "lucide-react";
import React from "react";
import { logoutUser } from "../action/auth/logoutUser";
import { useSelector } from "react-redux";
import RefreshTokenButton from "./RefreshButton";

const Navbar = ({ onMenuClick }) => {
  const userRedux = useSelector((state) => state.user);
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <button onClick={onMenuClick} className="-ml-2 rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold text-gray-900 tracking-tight sm:text-base">
          Academic Dashboard
        </span>

      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button aria-label="Notifications" className="hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-full transition relative hover:bg-gray-100 sm:block">
          <BellRing className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3 sm:border-l sm:border-gray-200 sm:pl-4">
          <p className="hidden text-sm font-medium text-gray-800 md:block">
            Hello,{" "}
            <span className="font-semibold text-gray-900">
              {userRedux?.userName || "User"}
            </span>
            !
          </p>
          <span
            className={
              "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider bg-gray-100 border " +
              (userRedux?.role === "admin"
                ? "text-red-600 border-red-200 bg-red-50/60"
                : userRedux?.role === "hod"
                  ? "text-yellow-600 border-yellow-200 bg-yellow-50/60"
                  : userRedux?.role === "faculty"
                    ? "text-green-600 border-green-200 bg-green-50/60"
                    : userRedux?.role === "student"
                      ? "text-blue-600 border-blue-200 bg-blue-50/60"
                      : "text-gray-600 border-gray-200")
            }
          >
            {userRedux?.role || "Guest"}
          </span>
        </div>
        <button
          onClick={logoutUser}
          className="text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md transition"
        >
          Logout
        </button>
      <span className="hidden sm:block"><RefreshTokenButton/></span>
      </div>
    </header>
  );
};

export default Navbar;

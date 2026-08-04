"use client";

import { usePathname } from "next/navigation";
import SideBar from "./SideBar";
import Navbar from "./Navbar";

const authRoutes = ["/login", "/signUp"];

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const showSideBar = !authRoutes.includes(pathname);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {showSideBar ? <SideBar /> : null}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {showSideBar ? <Navbar /> : null}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

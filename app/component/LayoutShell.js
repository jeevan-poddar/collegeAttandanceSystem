"use client";

import { usePathname } from "next/navigation";
import SideBar from "./SideBar";
import Navbar from "./Navbar";

const authRoutes = ["/login", "/signUp"];

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const showSideBar = !authRoutes.includes(pathname);

  return (
    <div className="flex min-h-full w-full h-full">
      {showSideBar ? <SideBar /> : null}
      <main className="flex flex-col w-full h-full">
        {showSideBar ? <Navbar /> : null}
        {children}
      </main>
    </div>
  );
}

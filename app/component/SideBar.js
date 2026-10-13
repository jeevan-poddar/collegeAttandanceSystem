"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";

const SideBar = ({ isOpen, onClose }) => {
  const userRedux = useSelector((state) => state.user);
  const pathname = usePathname();

  const role = userRedux?.role?.toLowerCase() || "";

  // Role-Based Access hierarchy matching proxy.js permissions
  const showAdmin = role === "admin";
  const showHOD = role === "hod";
  const showFaculty = role === "faculty" || role === "hod"; // HODs can access faculty sections
  const showStudent = role === "student";

  const linkClass = (href) =>
    `flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
      pathname === href
        ? "bg-gray-900 text-white font-semibold"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 font-medium"
    }`;

  return (
    <>
      <button
        aria-label="Close navigation overlay"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-gray-950/25 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:w-60 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
        <Link
          href="/"
          onClick={onClose}
          className="font-semibold text-base text-gray-950 tracking-tight flex items-center gap-2"
        >
          <span className="grid size-7 place-items-center rounded bg-gray-950 text-xs font-bold text-white">D</span>
          <span>DGI Portal</span>
        </Link>
        <button onClick={onClose} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.12em] px-3 mb-2 mt-2">
          Navigation
        </div>
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              onClick={onClose}
              className={linkClass("/")}
            >
              Home
            </Link>
          </li>
          {showFaculty && (
            <>
              <li>
                <Link
                  href="/dashboard/faculty"
                  onClick={onClose}
                  className={linkClass("/dashboard/faculty")}
                >
                  Dashboard Faculty
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/faculty/myBatches"
                  onClick={onClose}
                  className={linkClass("/dashboard/faculty/myBatches")}
                >
                  My Batches
                </Link>
              </li>
            </>
          )}
          {showStudent && (
            <li>
              <Link
                href="/dashboard/student"
                onClick={onClose}
                className={linkClass("/dashboard/student")}
              >
                Dashboard Student
              </Link>
            </li>
          )}
          {showHOD && (
            <li>
              <Link
                href="/dashboard/hod"
                onClick={onClose}
                className={linkClass("/dashboard/hod")}
              >
                Dashboard HOD
              </Link>
            </li>
          )}
          {showAdmin && (
            <>
              <li>
                <Link
                  href="/dashboard/admin"
                  onClick={onClose}
                  className={linkClass("/dashboard/admin")}
                >
                  Dashboard Admin
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        © 2026 DGI Portal
      </div>
      </aside>
    </>
  );
};

export default SideBar;

// "use client";
import Link from "next/link";
import React from "react";

const SideBar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-gray-50/50">
        <Link href="/" className="font-bold text-lg text-blue-600 tracking-tight flex items-center gap-2">
          <span>DGI Portal</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-2">
          Navigation
        </div>
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              className="flex items-center px-3.5 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/faculty"
              className="flex items-center px-3.5 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Dashboard Faculty
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/faculty/myBatches"
              className="flex items-center px-3.5 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              My Batches
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/hod"
              className="flex items-center px-3.5 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Dashboard HOD
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/admin"
              className="flex items-center px-3.5 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Dashboard Admin
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        © 2026 DGI Portal
      </div>
    </aside>
  );
};

export default SideBar;

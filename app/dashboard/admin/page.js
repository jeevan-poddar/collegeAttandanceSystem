// <Link href="/dashboard/hod/addSubject">Add Subject</Link>
// <Link href="/dashboard/hod/batches">Batches</Link>
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Manage academic metadata, subjects, semester batches, and enrollments</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/admin/addSubject"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Add & Manage Subjects</h2>
          <p className="text-xs text-gray-500 leading-relaxed">Register new subjects and subject codes into the academic repository.</p>
        </Link>
        <Link
          href="/dashboard/admin/batches"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Configure Batches</h2>
          <p className="text-xs text-gray-500 leading-relaxed">Create and manage class batches, session years, semesters, and room allocations.</p>
        </Link>
        <Link
          href="/dashboard/admin/assignStudents"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Assign Students</h2>
          <p className="text-xs text-gray-500 leading-relaxed">Search and enroll students into academic batches for a specific session year.</p>
        </Link>
      </div>
    </div>
  );
};

export default page;

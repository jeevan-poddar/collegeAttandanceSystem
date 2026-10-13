// <Link href="/dashboard/hod/addSubject">Add Subject</Link>
// <Link href="/dashboard/hod/batches">Batches</Link>
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className="page-shell max-w-6xl space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage academic metadata, subjects, semester batches, and student
          enrollments
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/admin/addSubject"
          className="minimal-card p-5 hover:border-gray-400 transition-colors group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Add & Manage Subjects
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Register new subjects and subject codes into the academic
            repository.
          </p>
        </Link>
        <Link
          href="/dashboard/admin/batches"
          className="minimal-card p-5 hover:border-gray-400 transition-colors group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Configure Batches
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Create and manage class batches, session years, semesters, and room
            allocations.
          </p>
        </Link>
        <Link
          href="/dashboard/admin/manageBatches"
          className="minimal-card p-5 hover:border-gray-400 transition-colors group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Manage Batches & Students
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Review existing batches, dynamically filter by session year, manage
            student batch enrollments, and update batch attributes or
            operational status.
          </p>
        </Link>
        <Link
          href="/dashboard/admin/assignRole"
          className="minimal-card p-5 hover:border-gray-400 transition-colors group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Assign Roles
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Assign roles to users based on their account creation date, with
            dynamic role selection and conditional display of student-specific
            fields.
          </p>
        </Link>
        <Link
          href="/dashboard/admin/manageRoles"
          className="minimal-card p-5 hover:border-gray-400 transition-colors group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Manage Roles
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            View, edit, and revoke assigned user roles. Search users by name or
            email and update role-specific details.
          </p>
        </Link>
        <Link
          href="/dashboard/admin/departments"
          className="minimal-card p-5 hover:border-gray-400 transition-colors group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Manage Departments
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Add new departments, update their details, and manage the list of academic departments.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default page;

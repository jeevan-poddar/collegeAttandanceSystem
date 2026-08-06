import Link from 'next/link';
import React from 'react';

const HodDashboardPage = () => {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HOD Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Manage departmental faculty allocations and semester timetables</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/hod/facultyAllocation"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all group block space-y-2 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Faculty Allocation</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">Assign teachers to specific batches and subjects for a given session year.</p>
          </div>
          <div className="pt-2 text-xs font-semibold text-blue-600 group-hover:underline">Configure Allocations &rarr;</div>
        </Link>
        <Link
          href="/dashboard/hod/manageFacultyAllocation"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group block space-y-2 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Manage Faculty Allocations</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">View, edit, filter, or remove existing teaching assignments across batches and subjects.</p>
          </div>
          <div className="pt-2 text-xs font-semibold text-emerald-600 group-hover:underline">Manage Records &rarr;</div>
        </Link>
        <Link
          href="/dashboard/hod/timetable"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all group block space-y-2 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Timetable Scheduling</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">Configure lecture periods, weekday schedules, and classroom assignments.</p>
          </div>
          <div className="pt-2 text-xs font-semibold text-blue-600 group-hover:underline">Create Timetable &rarr;</div>
        </Link>
        <Link
          href="/dashboard/hod/manageTimetable"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group block space-y-2 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Manage Timetables</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">Review schedules, update classroom numbers, change periods, and prevent lecture clashes.</p>
          </div>
          <div className="pt-2 text-xs font-semibold text-emerald-600 group-hover:underline">Manage Schedules &rarr;</div>
        </Link>
        <Link
          href="/dashboard/hod/batchAttendance"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all group block space-y-2 md:col-span-2 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Batch Attendance Monitoring</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">Monitor comprehensive student attendance registers across academic sessions, filter by academic session year, drill down into batch subject allocations, and inspect live attendance metrics.</p>
          </div>
          <div className="pt-2 text-xs font-semibold text-indigo-600 group-hover:underline">Monitor Attendance Registers &rarr;</div>
        </Link>
      </div>
    </div>
  );
};

export default HodDashboardPage;


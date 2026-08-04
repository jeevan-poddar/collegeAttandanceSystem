import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6 min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HOD Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Manage departmental faculty allocations and semester timetables</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/hod/facultyAllocation"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Faculty Allocation</h2>
          <p className="text-xs text-gray-500 leading-relaxed">Assign teachers to specific batches and subjects for a given session year.</p>
        </Link>
        <Link
          href="/dashboard/hod/timetable"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group block space-y-2"
        >
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Timetable Scheduling</h2>
          <p className="text-xs text-gray-500 leading-relaxed">Configure lecture periods, weekday schedules, and classroom assignments.</p>
        </Link>
      </div>
    </div>
  );
};

export default page

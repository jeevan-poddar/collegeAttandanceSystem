import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div>
      <div className="bg-gray-200 p-4 flex flex-col gap-4">
        <h1>HOD Dashboard</h1>
        <Link href="/dashboard/hod/facultyAllocation">Faculty Allocation</Link>
        <Link href="/dashboard/hod/timetable">Timetable</Link>

      </div>
    </div>
  );
}

export default page

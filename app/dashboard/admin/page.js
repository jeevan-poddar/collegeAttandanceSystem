// <Link href="/dashboard/hod/addSubject">Add Subject</Link>
// <Link href="/dashboard/hod/batches">Batches</Link>
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div>
      <div className="bg-gray-200 p-4 flex flex-col gap-4">
        <h1>Admin Dashboard</h1>
        <Link href="/dashboard/admin/addSubject">Add Subject</Link>
        <Link href="/dashboard/admin/batches">Batches</Link>
      </div>
    </div>
  );
};

export default page;

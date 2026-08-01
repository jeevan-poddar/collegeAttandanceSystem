// "use client";
import Link from "next/link";
import React from "react";

const SideBar = () => {
  return (
    <div>
      <div className="">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/dashboard/faculty">DashBoard</Link>
          </li>
          <li>
            <Link href="/dashboard/faculty/myBatches">My Batches</Link>
          </li>
          <li><Link href="/dashboard/hod">Dashboard HOD</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default SideBar;

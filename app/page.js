"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getUser } from "./action/getUser";

const home = () => {
  const [user, setUser] = useState(null);
  const periods = [
    { id: 1, time: "09:00 AM - 10:00 AM" },
    { id: 2, time: "10:00 AM - 11:00 AM" },
    { id: 3, time: "11:15 AM - 12:15 PM" },
    { id: 4, time: "12:15 PM - 01:15 PM" },
    { id: 5, time: "02:00 PM - 03:00 PM" },
  ];
  const MOCK_SCHEDULE = [
    {
      id: 1,
      batch_code: "B1",
      sem: 1,
      section: "A",
      subject: "Math",
      roomNo: "101",
      branch: "CSE",
      status: "scheduled",
      is_proxy: false,
      


    }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const response = await getUser();
      if (response) {
        setUser(response);
      }
    };
    fetchUser();
  }, []);

  if (user?.role === "faculty") {
    return (
      <>
        <div>Welcome, {user?.full_name}! You are a faculty member.</div>
        <div className="timeTabel">
          <div className="">Time Table</div>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
                <th>Sunday</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </>
    );
  } else if (user?.role === "student") {
    return <div>Welcome, {user?.full_name}! You are a student.</div>;
  } else if (user?.role === "hod") {
    return <div>Welcome, {user?.full_name}! You are a head of department.</div>;
  } else if (user?.role === "admin") {
    return <div>Welcome, {user?.full_name}! You are an administrator.</div>;
  } else {
    return <div>Welcome, {user?.full_name}! Your role is not recognized.</div>;
  }
};

export default home;

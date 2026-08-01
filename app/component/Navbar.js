"use client";
import { BellRing } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getUser } from "../action/getUser";
import { logOut } from "../action/logOut";

const Navbar = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchUser = async () => {
      const response = await getUser();
      if (response) {
        setUser(response);
      }
    };
    fetchUser();
  }, []);
  return (
    <div className="flex flex-end">
      <BellRing />
      <p>Hello, {user?.full_name || "User"}!</p>
      <div
        className={
          "ml-2 " +
          (user?.role === "admin"
            ? "text-red-500"
            : user?.role === "hod"
              ? "text-yellow-500"
              : user?.role === "faculty"
                ? "text-green-500"
                : user?.role === "student"
                  ? "text-blue-500"
                  : "text-gray-500")
        }
      >
        {user?.role}
      </div>
      <button onClick={logOut}>Logout</button>
    </div>
  );
};

export default Navbar;

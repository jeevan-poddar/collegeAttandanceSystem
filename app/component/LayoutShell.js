"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { getUser } from "../action/auth/getUser";
import { setUser } from "../redux/user/userSlice";
import SideBar from "./SideBar";
import Navbar from "./Navbar";

const authRoutes = ["/login", "/signUp"];

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const showSideBar = !authRoutes.includes(pathname);

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      const response = await getUser();
      if (!isMounted || !response) return;

      dispatch(
        setUser({
          userName: response.full_name,
          email: response.email,
          role: response.role,
          isAuthenticated: response.isAuthenticated,
          userId: response.id,
        }),
      );
    }

    hydrateUser();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {showSideBar ? <SideBar /> : null}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {showSideBar ? <Navbar /> : null}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

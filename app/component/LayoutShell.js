"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { getUser } from "../action/auth/getUser";
import { clearUser, setUser } from "../redux/user/userSlice";
import SideBar from "./SideBar";
import Navbar from "./Navbar";

const authRoutes = ["/login", "/signUp"];

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const showSideBar = !authRoutes.includes(pathname);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      const response = await getUser();
      if (!isMounted) return;

      if (!response) {
        dispatch(clearUser());
        return;
      }

      dispatch(
        setUser({
          userName: response.full_name,
          email: response.email,
          role: response.role,
          userId: response.id,
        }),
      );
    }

    hydrateUser();
    return () => {
      isMounted = false;
    };
  }, [dispatch, pathname]);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {showSideBar ? (
        <SideBar
          isOpen={isNavigationOpen}
          onClose={() => setIsNavigationOpen(false)}
        />
      ) : null}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {showSideBar ? (
          <Navbar onMenuClick={() => setIsNavigationOpen(true)} />
        ) : null}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

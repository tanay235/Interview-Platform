"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login" && pathname !== "/signup") router.replace("/login");
  }, [isLoading, pathname, router, user]);

  if (pathname === "/login" || pathname === "/signup") return <>{children}</>;

  if (isLoading || !user) return <PageLoader label="Checking your account..." />;

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="lg:ml-[var(--sidebar-width)]">
        <Navbar
          onMenuClick={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

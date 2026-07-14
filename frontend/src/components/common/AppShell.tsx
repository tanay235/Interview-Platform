"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

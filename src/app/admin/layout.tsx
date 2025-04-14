"use client";

import type React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      // If not admin, redirect to login page
      router.push("/admin/login");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // If not admin and not loading, don't render the admin layout
  //if (!isAdmin) {
  //return null
  //}

  // Determine which nav item is active
  const isQuestionsActive = pathname?.includes("/admin/questions");
  const isDashboardActive =
    pathname === "/admin" || pathname === "/admin/dashboard";

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <nav className="flex gap-6">
          <Link
            href="/admin"
            className={`text-sm font-medium ${isDashboardActive ? "text-primary" : "hover:text-primary"}`}
          >
            Sessions
          </Link>
          <Link
            href="/admin/questions"
            className={`text-sm font-medium ${isQuestionsActive ? "text-primary" : "hover:text-primary"}`}
          >
            Questions
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

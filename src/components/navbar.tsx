"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function Navbar() {
  const { isAdmin, signOut } = useAuth();

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-primary">
            <Link href="/">DevDay 2025 - Pub Quiz</Link>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-4">
              <>
                <Link
                  href="/"
                  className="text-sm px-4 py-2 rounded-md bg-primary hover:bg-primary/90"
                >
                  Home
                </Link>
                <Link
                  href="/admin"
                  className="text-sm px-4 py-2 rounded-md bg-primary hover:bg-primary/90"
                >
                  Admin
                </Link>
              </>
              <button
                onClick={signOut}
                className="text-sm px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

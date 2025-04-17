"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActiveSessions } from "@/lib/firebase/sessions";
import type { Session } from "@/lib/firebase/sessions";

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const activeSessions = await getActiveSessions();
        console.log("Fetched active sessions:", activeSessions); // Debug log
        setSessions(activeSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setError("Failed to load active sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2 text-center">
          Certinia Developer Day 2025
        </h1>
        <p className="text-xl mb-8 text-center text-muted-foreground">
          Clean Code Pub Quiz
        </p>

        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-semibold">Active Sessions</h2>
          </div>

          {loading ? (
            <div className="w-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-lg text-red-500">{error}</p>
              <p className="text-muted-foreground mt-1">
                Please try refreshing the page
              </p>
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-6 border rounded-lg bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow shadow-purple-600/20 hover:shadow-purple-600/20"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-medium">{session.name}</h3>
                      <div className="my-2 border-t border-muted-foreground/40" />
                      <p>Questions: {session.questionCount}</p>
                    </div>
                    <Link
                      href={`/quiz/${session.id}/join`}
                      className="bg-green-600 text-secondary-foreground px-4 py-2 rounded-md font-medium hover:bg-green-700/80 transition-colors shadow-xl"
                    >
                      Join Session
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-lg text-muted-foreground">
                No active sessions at the moment
              </p>
              <p className="text-muted-foreground mt-1">
                Check back later or create a new session from the admin panel
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

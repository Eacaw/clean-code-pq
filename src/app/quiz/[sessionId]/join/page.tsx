"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

export default function JoinSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSessionData() {
      try {
        const sessionDoc = await getDoc(doc(db, "sessions", sessionId));

        if (!sessionDoc.exists()) {
          setError("Session not found. Please check the URL and try again.");
          setLoading(false);
          return;
        }

        const data = sessionDoc.data();
        setSessionData({
          id: sessionDoc.id,
          ...data,
        });

        // Check if session is active
        if (data.status !== "active") {
          setError(
            "This session is not currently active. Please try again later."
          );
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching session:", err);
        setError("Failed to load session. Please try again.");
        setLoading(false);
      }
    }

    fetchSessionData();
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Generate a unique team ID
      const teamId = uuidv4();

      // Create team document in Firestore
      const teamRef = collection(db, `sessions/${sessionId}/teams`);
      await addDoc(teamRef, {
        name: teamName.trim(),
        score: 0,
        createdAt: serverTimestamp(),
      });

      // Store session info in Session Storage
      sessionStorage.setItem(
        "devday_session",
        JSON.stringify({
          sessionId,
          teamId,
          teamName: teamName.trim(),
        })
      );

      // Redirect to quiz page
      router.push(`/quiz/${sessionId}/play`);
    } catch (err) {
      console.error("Error joining session:", err);
      setError("Failed to join session. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Join Session</h1>

        {error ? (
          <div className="bg-red-900/30 text-red-400 p-4 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {sessionData?.name || "DevDay Session"}
            </h2>
            <p className="text-gray-400">
              Enter your team name to join this coding competition.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="teamName"
              className="block text-sm font-medium mb-1"
            >
              Team Name
            </label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
              placeholder="Enter your team name"
              disabled={!!error || submitting}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium"
            disabled={!!error || submitting}
          >
            {submitting ? "Joining..." : "Join Session"}
          </button>
        </form>
      </div>
    </div>
  );
}

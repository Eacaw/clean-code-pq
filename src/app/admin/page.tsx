"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Session } from "@/types";
import { PlusCircle, Play, Settings, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import CreateSessionModal from "@/components/admin/create-session-modal";

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  // Check if there's an active session
  const hasActiveSession = sessions.some(
    (session) => session.status === "active"
  );

  useEffect(() => {
    async function fetchSessions() {
      try {
        const sessionsQuery = query(
          collection(db, "sessions"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(sessionsQuery);

        const fetchedSessions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Session[];

        setSessions(fetchedSessions);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to load sessions. Please try again.");
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  const handleActivateSession = async (sessionId: string) => {
    if (hasActiveSession) {
      if (
        !window.confirm(
          "There is already an active session. Do you want to deactivate it and activate this one instead?"
        )
      ) {
        return;
      }

      // Deactivate all other sessions
      for (const session of sessions) {
        if (session.status === "active") {
          await updateDoc(doc(db, "sessions", session.id), {
            status: "pending",
          });
        }
      }
    }

    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "active",
      });

      // Update local state
      setSessions(
        sessions.map((session) =>
          session.id === sessionId
            ? { ...session, status: "active" }
            : session.status === "active"
              ? { ...session, status: "pending" }
              : session
        )
      );
    } catch (err) {
      console.error("Error activating session:", err);
      alert("Failed to activate session. Please try again.");
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (
      !window.confirm("Are you sure you want to mark this session as complete?")
    ) {
      return;
    }

    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "completed",
      });

      // Update local state
      setSessions(
        sessions.map((session) =>
          session.id === sessionId
            ? { ...session, status: "completed" }
            : session
        )
      );
    } catch (err) {
      console.error("Error completing session:", err);
      alert("Failed to complete session. Please try again.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this session? This action cannot be undone and will delete all related data."
      )
    ) {
      return;
    }

    try {
      setDeletingSession(sessionId);
      const batch = writeBatch(db);

      // Delete the session document
      const sessionRef = doc(db, "sessions", sessionId);
      batch.delete(sessionRef);

      // Delete associated team responses
      const responsesQuery = query(
        collection(db, "responses"),
        where("sessionId", "==", sessionId)
      );

      const responseSnapshot = await getDocs(responsesQuery);
      responseSnapshot.forEach((docSnapshot) => {
        batch.delete(doc(db, "responses", docSnapshot.id));
      });

      // Delete associated teams
      const teamsQuery = query(
        collection(db, "teams"),
        where("sessionId", "==", sessionId)
      );

      const teamsSnapshot = await getDocs(teamsQuery);
      teamsSnapshot.forEach((docSnapshot) => {
        batch.delete(doc(db, "teams", docSnapshot.id));
      });

      // Commit the batch
      await batch.commit();

      // Update local state
      setSessions(sessions.filter((session) => session.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Failed to delete session. Please try again.");
    } finally {
      setDeletingSession(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading sessions...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Session Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
        >
          <PlusCircle size={18} />
          <span>Create New Session</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center p-8 bg-gray-900 rounded-lg">
          <p className="text-gray-400">
            No sessions found. Create your first session!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900 text-left">
                <th className="p-4 border-b border-gray-800">Session Name</th>
                <th className="p-4 border-b border-gray-800">Created At</th>
                <th className="p-4 border-b border-gray-800">Status</th>
                <th className="p-4 border-b border-gray-800">Questions</th>
                <th className="p-4 border-b border-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-gray-800 hover:bg-gray-900/50"
                >
                  <td className="p-4">{session.name}</td>
                  <td className="p-4">
                    {session.createdAt?.toDate
                      ? session.createdAt.toDate().toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        session.status === "active"
                          ? "bg-green-900/30 text-green-400"
                          : session.status === "completed"
                            ? "bg-gray-800 text-gray-400"
                            : "bg-yellow-900/30 text-yellow-400"
                      }`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="p-4">{session.questionIds?.length || 0}</td>
                  <td className="p-4 flex gap-2">
                    {session.status !== "completed" && (
                      <>
                        {session.status !== "active" && (
                          <button
                            onClick={() => handleActivateSession(session.id)}
                            className="p-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded-md"
                            title="Activate Session"
                          >
                            <Play size={16} />
                          </button>
                        )}

                        <Link
                          href={`/admin/host/${session.id}`}
                          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md"
                          title="Host Controls"
                        >
                          <Settings size={16} />
                        </Link>

                        <button
                          onClick={() => handleCompleteSession(session.id)}
                          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md"
                          title="Set Complete"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </>
                    )}

                    <Link
                      href={`/admin/manage/${session.id}`}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md"
                      title="Manage & Mark"
                    >
                      <span className="text-xs font-medium">Manage</span>
                    </Link>

                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={deletingSession === session.id}
                      className="p-2 bg-red-900/20 hover:bg-red-900/30 text-red-500 hover:text-red-400 rounded-md"
                      title="Delete Session"
                    >
                      {deletingSession === session.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <CreateSessionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSessionCreated={(newSession) => {
            setSessions([newSession, ...sessions]);
          }}
        />
      )}
    </div>
  );
}

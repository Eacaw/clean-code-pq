"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { Session, Team, Question } from "@/types";
import AdminCountdownTimer from "@/components/admin/admin-countdown-timer";
import { Play, AlertTriangle } from "lucide-react";

export default function AdminHostPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [isLoading, isAdmin, router]);

  // Listen to session document in real-time
  useEffect(() => {
    if (!isAdmin) return;

    const sessionRef = doc(db, "sessions", sessionId);
    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();

          // Convert Firestore timestamp to Date
          const startTime = data.currentQuestionStartTime?.toDate
            ? data.currentQuestionStartTime.toDate()
            : null;

          setSession({
            id: docSnapshot.id,
            ...data,
            currentQuestionStartTime: startTime,
          } as Session);

          setLoading(false);
        } else {
          setError("Session not found");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to session:", err);
        setError("Failed to connect to session. Please refresh the page.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId, isAdmin]);

  // Listen to top teams
  useEffect(() => {
    if (!isAdmin) return;

    const teamsRef = collection(db, `sessions/${sessionId}/teams`);
    const topTeamsQuery = query(teamsRef, orderBy("score", "desc"), limit(3));

    const unsubscribe = onSnapshot(
      topTeamsQuery,
      (querySnapshot) => {
        const teams = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];

        setTopTeams(teams);
      },
      (err) => {
        console.error("Error listening to teams:", err);
      }
    );

    return () => unsubscribe();
  }, [sessionId, isAdmin]);

  // Fetch current question data when the question index changes
  useEffect(() => {
    if (
      !session ||
      session.currentQuestionIndex === undefined ||
      session.currentQuestionIndex < 0
    ) {
      setCurrentQuestion(null);
      return;
    }

    const fetchCurrentQuestion = async () => {
      try {
        const questionId = session.questionIds?.[session.currentQuestionIndex];
        if (!questionId) {
          setCurrentQuestion(null);
          return;
        }

        const questionDoc = await getDoc(doc(db, "questions", questionId));
        if (questionDoc.exists()) {
          setCurrentQuestion({
            id: questionDoc.id,
            ...questionDoc.data(),
          } as Question);
        }
      } catch (err) {
        console.error("Error fetching question:", err);
      }
    };

    fetchCurrentQuestion();
  }, [session?.currentQuestionIndex, session?.questionIds]);

  const unlockNextQuestion = async () => {
    if (!session || isUpdating) return;

    setIsUpdating(true);

    try {
      const sessionRef = doc(db, "sessions", sessionId);

      // Get current question index
      const currentIndex =
        session.currentQuestionIndex !== undefined
          ? session.currentQuestionIndex
          : -1;

      // Check if we have more questions
      const nextIndex = currentIndex + 1;
      if (!session.questionIds || nextIndex >= session.questionIds.length) {
        // No more questions, end the session
        await updateDoc(sessionRef, {
          status: "completed",
          currentQuestionIndex: -1,
          currentQuestionStartTime: null,
        });

        alert(
          "All questions have been completed. Session marked as completed."
        );
        return;
      }

      // Update session with next question
      await updateDoc(sessionRef, {
        currentQuestionIndex: nextIndex,
        currentQuestionStartTime: serverTimestamp(),
        status: "active",
      });
    } catch (err) {
      console.error("Error unlocking next question:", err);
      setError("Failed to unlock next question. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-red-900/30 text-red-400 p-4 rounded-md">{error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-red-900/30 text-red-400 p-4 rounded-md">
          Session not found
        </div>
      </div>
    );
  }

  const isQuestionActive =
    session.status === "active" &&
    session.currentQuestionIndex !== undefined &&
    session.currentQuestionIndex >= 0 &&
    session.currentQuestionStartTime;

  // Get current question details
  const currentQuestionIndex =
    session.currentQuestionIndex !== undefined
      ? session.currentQuestionIndex
      : -1;
  const totalQuestions = session.questionIds?.length || 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isSessionCompleted = session.status === "completed";

  // Get current question time limit from the actual question data
  const currentQuestionTimeLimit = currentQuestion?.timeLimit || 300; // Fallback to 5 minutes if not available

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Host Controls</h1>
        <div className="text-sm px-3 py-1 rounded-full bg-gray-800">
          Session ID: {sessionId}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold">{session.name}</h2>
            <p className="text-gray-400">
              Status:{" "}
              <span
                className={`font-medium ${
                  session.status === "active"
                    ? "text-green-400"
                    : session.status === "completed"
                      ? "text-gray-400"
                      : "text-yellow-400"
                }`}
              >
                {session.status}
              </span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-medium">
              {currentQuestionIndex >= 0
                ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}`
                : "Ready to start"}
            </p>
            {isQuestionActive && session.currentQuestionStartTime && (
              <AdminCountdownTimer
                startTime={session.currentQuestionStartTime}
                duration={currentQuestionTimeLimit}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Session controls */}
          <div className="flex justify-center">
            {isSessionCompleted ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-md text-gray-400">
                <AlertTriangle size={18} />
                <span>Session completed</span>
              </div>
            ) : (
              <button
                onClick={unlockNextQuestion}
                disabled={isUpdating || isSessionCompleted}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium ${
                  isUpdating
                    ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                <Play size={18} />
                <span>
                  {isUpdating
                    ? "Processing..."
                    : currentQuestionIndex < 0
                      ? "Start First Question"
                      : isLastQuestion
                        ? "Complete Session"
                        : "Unlock Next Question"}
                </span>
              </button>
            )}
          </div>

          {/* Warning about sensitive data */}
          <div className="p-4 bg-yellow-900/20 border border-yellow-900/30 rounded-md">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> Question content and answers are not
              displayed here to prevent accidental sharing. Use the Questions
              management page to view question details.
            </p>
          </div>

          {/* Top teams */}
          {topTeams.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Top Teams</h3>
              <div className="grid gap-3">
                {topTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`flex justify-between items-center p-3 rounded-md ${
                      index === 0
                        ? "bg-yellow-900/20 border border-yellow-900/30"
                        : "bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          index === 0
                            ? "bg-yellow-500 text-gray-900"
                            : index === 1
                              ? "bg-gray-400 text-gray-900"
                              : "bg-amber-700 text-gray-200"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <div className="font-bold">{team.score} pts</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

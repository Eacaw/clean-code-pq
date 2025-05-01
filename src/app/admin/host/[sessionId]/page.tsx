"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { Session, Team, Question } from "@/types";
import AdminCountdownTimer from "@/components/admin/admin-countdown-timer";
import { Play, AlertTriangle, X as XIcon, CheckCircle } from "lucide-react";

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teamSubmissions, setTeamSubmissions] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [isLoading, isAdmin, router]);

  // Navigate to the session management page on click
  const handleSessionManagementClick = () => {
    router.push(`/admin/manage/${sessionId}`);
  };

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

  // Listen to top teams (real-time)
  useEffect(() => {
    if (!isAdmin) return;

    const teamsRef = collection(db, `sessions/${sessionId}/teams`);
    const topTeamsQuery = query(teamsRef, orderBy("score", "desc"));

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

  // Listen to submissions for top teams and all questions (real-time)
  useEffect(() => {
    if (!isAdmin || topTeams.length === 0 || !session?.questionIds?.length)
      return;

    // Listen only for submissions from the current top teams
    const unsub = onSnapshot(
      collection(db, `sessions/${sessionId}/submissions`),
      (snapshot) => {
        // Build a map: teamId -> questionId -> hasSubmitted
        const submissionMap: Record<string, Record<string, boolean>> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const teamId = data.teamId;
          const questionId = data.questionId;
          // Only consider submissions from teams currently in topTeams
          if (
            teamId &&
            questionId &&
            topTeams.some((team) => team.id === teamId)
          ) {
            if (!submissionMap[teamId]) submissionMap[teamId] = {};
            submissionMap[teamId][questionId] = true;
          }
        });
        setTeamSubmissions(submissionMap);
      }
    );

    return () => unsub();
  }, [sessionId, isAdmin, topTeams, session?.questionIds]);

  // Fetch all questions for the session up front
  useEffect(() => {
    if (!session || !session.questionIds || session.questionIds.length === 0) {
      setQuestions([]);
      setCurrentQuestion(null);
      return;
    }
    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        const questionDocs = await Promise.all(
          session.questionIds.map((qid) => getDoc(doc(db, "questions", qid)))
        );
        const fetchedQuestions = questionDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Question[];
        if (isMounted) {
          setQuestions(fetchedQuestions);
          // Set current question if index is valid
          if (
            session.currentQuestionIndex !== undefined &&
            session.currentQuestionIndex >= 0 &&
            session.currentQuestionIndex < fetchedQuestions.length
          ) {
            setCurrentQuestion(fetchedQuestions[session.currentQuestionIndex]);
          } else {
            setCurrentQuestion(null);
          }
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };
    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [session]);

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

  const currentQuestionIndex =
    session.currentQuestionIndex !== undefined
      ? session.currentQuestionIndex
      : -1;
  const totalQuestions = session.questionIds?.length || 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isSessionCompleted = session.status === "completed";
  const currentQuestionTimeLimit = currentQuestion?.timeLimit || 300;

  // Determine question status for each question
  const getQuestionStatus = (idx: number) => {
    if (session.currentQuestionIndex === undefined) return "not_started";
    if (idx < session.currentQuestionIndex) return "done";
    if (idx === session.currentQuestionIndex && isQuestionActive)
      return "active";
    return "not_started";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Host Controls</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSessionManagementClick}
            className="text-sm font-medium text-gray-400 hover:text-primary"
          >
            Go to marking
          </button>
          <div className="text-sm px-3 py-1 rounded-full bg-gray-800">
            Session ID: {sessionId}
          </div>
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

        {/* Question Cards */}
        {questions.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-4 justify-center">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(idx);
              return (
                <div
                  key={q.id}
                  className={`flex flex-col items-center justify-center w-56 min-h-[90px] p-4 rounded-lg border transition-all
                    ${
                      status === "done"
                        ? "bg-green-900/20 border-green-700"
                        : status === "active"
                          ? "bg-primary/20 border-primary"
                          : "bg-gray-800 border-gray-700 opacity-70"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg">Q{idx + 1}</span>
                    {status === "done" ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : status === "active" ? (
                      <span className="text-primary font-bold text-xs">
                        Active
                      </span>
                    ) : (
                      <XIcon className="text-gray-500" size={20} />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{q.type}</div>
                </div>
              );
            })}
          </div>
        )}

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

          {/* Top teams table */}
          {topTeams.length > 0 && questions.length > 0 && (
            <div className="mt-8 overflow-x-auto">
              <h3 className="text-lg font-medium mb-4">Participating Teams</h3>
              <table className="min-w-full border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-800 text-left">
                    <th className="p-3 border-b border-gray-700">Team</th>
                    {questions.map((q, idx) => (
                      <th
                        key={q.id}
                        className="p-3 border-b border-gray-700 text-center"
                      >
                        Q{idx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topTeams.map((team) => (
                    <tr key={team.id} className="border-b border-gray-800">
                      <td className="p-3 font-medium">{team.name}</td>
                      {questions.map((q) => {
                        const submitted =
                          teamSubmissions[team.id]?.[q.id] ?? false;
                        return (
                          <td key={q.id} className="p-3 text-center">
                            {submitted ? (
                              <CheckCircle
                                className="text-green-500 inline"
                                size={18}
                              />
                            ) : (
                              <XIcon
                                className="text-red-500 inline"
                                size={18}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

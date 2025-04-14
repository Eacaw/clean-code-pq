"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question, Session } from "@/types";
import WaitingScreen from "@/components/quiz/waiting-screen";
import QuestionDisplay from "@/components/quiz/question-display";

interface SessionStorage {
  sessionId: string;
  teamId: string;
  teamName: string;
}

export default function QuizPlayPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const router = useRouter();

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teamInfo, setTeamInfo] = useState<{
    teamId: string;
    teamName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check if user has joined the session
  useEffect(() => {
    const storedSession = sessionStorage.getItem("devday_session");

    if (!storedSession) {
      router.push(`/quiz/${sessionId}/join`);
      return;
    }

    try {
      const sessionInfo: SessionStorage = JSON.parse(storedSession);

      // Verify the stored sessionId matches the current URL
      if (sessionInfo.sessionId !== sessionId) {
        router.push(`/quiz/${sessionId}/join`);
        return;
      }

      setTeamInfo({
        teamId: sessionInfo.teamId,
        teamName: sessionInfo.teamName,
      });
    } catch (err) {
      console.error("Error parsing session storage:", err);
      router.push(`/quiz/${sessionId}/join`);
    }
  }, [sessionId, router]);

  // Set up real-time listener for session data
  useEffect(() => {
    if (!teamInfo) return;

    const sessionRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as Omit<Session, "id">;

          // Convert Firestore timestamp to Date
          const startTime = data.currentQuestionStartTime?.toDate
            ? data.currentQuestionStartTime.toDate()
            : new Date();

          setSessionData({
            id: docSnapshot.id,
            ...data,
            currentQuestionStartTime: startTime,
          });

          // Reset submission state when question changes
          setHasSubmitted(false);

          // Check if there's a current question
          if (
            data.currentQuestionIndex !== undefined &&
            data.currentQuestionIndex >= 0 &&
            data.questionIds &&
            data.questionIds[data.currentQuestionIndex]
          ) {
            // Fetch the current question data
            fetchQuestionData(data.questionIds[data.currentQuestionIndex]);
          } else {
            setCurrentQuestion(null);
          }

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
  }, [sessionId, teamInfo]);

  // Function to fetch question data
  const fetchQuestionData = async (questionId: string) => {
    try {
      const questionDoc = await getDoc(doc(db, "questions", questionId));

      if (questionDoc.exists()) {
        setCurrentQuestion({
          id: questionDoc.id,
          ...questionDoc.data(),
        } as Question);
      } else {
        console.error("Question not found:", questionId);
        setCurrentQuestion(null);
      }
    } catch (err) {
      console.error("Error fetching question:", err);
    }
  };

  const handleSubmissionComplete = () => {
    setHasSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">Loading quiz...</div>
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

  const isQuestionActive =
    sessionData?.status === "active" &&
    sessionData.currentQuestionIndex !== undefined &&
    sessionData.currentQuestionIndex >= 0 &&
    currentQuestion &&
    sessionData.currentQuestionStartTime &&
    teamInfo !== null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-lg shadow-lg p-6">
        {/* Header with session and team info */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-bold">
              {sessionData?.name || "DevDay Session"}
            </h1>
            <p className="text-gray-400">
              Question{" "}
              {sessionData?.currentQuestionIndex !== undefined &&
              sessionData.currentQuestionIndex >= 0
                ? `${sessionData.currentQuestionIndex + 1} `
                : "0 "}
              of {sessionData?.questionIds?.length || 0}
            </p>
          </div>
          <div className="text-right">
            <div className="text-primary font-medium">
              Team: {teamInfo?.teamName}
            </div>
            <div className="text-sm text-gray-400">
              Status: {sessionData?.status || "unknown"}
            </div>
          </div>
        </div>

        {/* Quiz content */}
        <div>
          {!isQuestionActive || hasSubmitted ? (
            <WaitingScreen
              isQuizComplete={
                sessionData?.currentQuestionIndex !== undefined &&
                sessionData?.questionIds?.length !== undefined &&
                sessionData.currentQuestionIndex >=
                  sessionData.questionIds.length - 1 &&
                hasSubmitted
              }
            />
          ) : (
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={sessionData.currentQuestionIndex! + 1}
              sessionId={sessionId}
              teamInfo={teamInfo}
              currentQuestionIndex={sessionData.currentQuestionIndex!}
              currentQuestionStartTime={sessionData.currentQuestionStartTime!}
              onSubmissionComplete={handleSubmissionComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

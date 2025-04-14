"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  updateDoc,
  serverTimestamp,
  orderBy,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { Session, Question, Submission, Team } from "@/types";
import MarkingDialog from "@/components/admin/marking-dialog";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileCode,
  Award,
  RefreshCw,
  Calculator,
} from "lucide-react";

export default function ManageSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();
  const { sessionId } = params;
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isMarkingDialogOpen, setIsMarkingDialogOpen] = useState(false);
  const [processingQuestionId, setProcessingQuestionId] = useState<
    string | null
  >(null);
  const [isUpdatingScores, setIsUpdatingScores] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/admin/login");
    }
  }, [isLoading, isAdmin, router]);

  // Fetch questions
  const fetchQuestions = useCallback(async (questionIds: string[]) => {
    if (questionIds.length === 0) return;

    try {
      const questionPromises = questionIds.map((id) =>
        getDoc(doc(db, "questions", id))
      );
      const questionDocs = await Promise.all(questionPromises);

      const fetchedQuestions = questionDocs
        .filter((doc) => doc.exists())
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Question[];

      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  }, []);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    try {
      const submissionsRef = collection(
        db,
        `sessions/${sessionId}/submissions`
      );
      const submissionsQuery = query(
        submissionsRef,
        orderBy("submittedAt", "desc")
      );
      const querySnapshot = await getDocs(submissionsQuery);

      const fetchedSubmissions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[];

      setSubmissions(fetchedSubmissions);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  }, [sessionId]);

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    try {
      const teamsRef = collection(db, `sessions/${sessionId}/teams`);
      const teamsQuery = query(teamsRef, orderBy("score", "desc"));
      const querySnapshot = await getDocs(teamsQuery);

      const fetchedTeams = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];

      setTeams(fetchedTeams);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  }, [sessionId]);

  // Fetch session data
  useEffect(() => {
    if (!isAdmin) return;

    async function fetchSessionData() {
      try {
        const sessionDoc = await getDoc(doc(db, "sessions", sessionId));

        if (!sessionDoc.exists()) {
          setError("Session not found");
          setLoading(false);
          return;
        }

        const sessionData = {
          id: sessionDoc.id,
          ...sessionDoc.data(),
        } as Session;

        setSession(sessionData);

        // Fetch questions for this session
        await fetchQuestions(sessionData.questionIds || []);

        // Fetch submissions for this session
        await fetchSubmissions();

        // Fetch teams for this session
        await fetchTeams();

        setLoading(false);
      } catch (err) {
        console.error("Error fetching session:", err);
        setError("Failed to load session data. Please try again.");
        setLoading(false);
      }
    }

    fetchSessionData();
  }, [sessionId, isAdmin, fetchQuestions, fetchSubmissions, fetchTeams]);

  // Handle marking submission
  const handleMarkSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsMarkingDialogOpen(true);
  };

  // Handle saving score
  const handleSaveScore = async (
    submissionId: string,
    criteria: Record<string, number>
  ) => {
    try {
      // Calculate total score (sum of all criteria)
      const totalScore = Object.values(criteria).reduce(
        (sum, score) => sum + score,
        0
      );

      // Update submission in Firestore
      const submissionRef = doc(
        db,
        `sessions/${sessionId}/submissions/${submissionId}`
      );
      await updateDoc(submissionRef, {
        score: totalScore,
        criteria,
        status: "marked",
        markedAt: serverTimestamp(),
      });

      // Update local state
      setSubmissions(
        submissions.map((sub) =>
          sub.id === submissionId
            ? {
                ...sub,
                score: totalScore,
                criteria,
                status: "marked",
                markedAt: new Date(),
              }
            : sub
        )
      );

      // Close dialog
      setIsMarkingDialogOpen(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Error saving score:", err);
      alert("Failed to save score. Please try again.");
    }
  };

  // Calculate concise code bonus
  const calculateConciseBonus = async (questionId: string) => {
    setProcessingQuestionId(questionId);

    try {
      // Get all submissions for this question
      const questionSubmissions = submissions.filter(
        (sub) =>
          sub.questionId === questionId &&
          sub.questionType === "concise_code" &&
          sub.status === "marked"
      );

      if (questionSubmissions.length === 0) {
        alert("No marked submissions found for this question.");
        setProcessingQuestionId(null);
        return;
      }

      // Calculate code length for each submission (trimming whitespace)
      const submissionsWithLength = questionSubmissions.map((sub) => ({
        ...sub,
        codeLength: (sub.code || "").replace(/\s+/g, "").length,
      }));

      // Sort by code length (ascending)
      submissionsWithLength.sort((a, b) => a.codeLength - b.codeLength);

      // Award bonus points (5 for shortest, 4 for 2nd, etc.)
      const batch = writeBatch(db);
      const updatedSubmissions: Submission[] = [...submissions];

      for (let i = 0; i < Math.min(5, submissionsWithLength.length); i++) {
        const submission = submissionsWithLength[i];
        const bonusPoints = 5 - i; // 5, 4, 3, 2, 1
        const newScore = (submission.score || 0) + bonusPoints;

        // Update in Firestore batch
        const submissionRef = doc(
          db,
          `sessions/${sessionId}/submissions/${submission.id}`
        );
        batch.update(submissionRef, {
          score: newScore,
          conciseBonus: bonusPoints,
        });

        // Update in local state
        const index = updatedSubmissions.findIndex(
          (sub) => sub.id === submission.id
        );
        if (index !== -1) {
          updatedSubmissions[index] = {
            ...updatedSubmissions[index],
            score: newScore,
            conciseBonus: bonusPoints,
          };
        }
      }

      // Commit the batch
      await batch.commit();

      // Update local state
      setSubmissions(updatedSubmissions);

      alert("Concise code bonuses calculated and applied successfully!");
    } catch (err) {
      console.error("Error calculating concise bonus:", err);
      alert("Failed to calculate concise code bonuses. Please try again.");
    } finally {
      setProcessingQuestionId(null);
    }
  };

  // Update final scores and leaderboard
  const updateFinalScores = async () => {
    setIsUpdatingScores(true);

    try {
      // Group submissions by team and calculate total score
      const teamScores: Record<
        string,
        { teamId: string; teamName: string; totalScore: number }
      > = {};

      submissions.forEach((submission) => {
        const { teamId, teamName, score = 0 } = submission;
        if (!teamScores[teamId]) {
          teamScores[teamId] = { teamId, teamName, totalScore: 0 };
        }
        teamScores[teamId].totalScore += score;
      });

      // Update team documents with total scores
      const batch = writeBatch(db);
      const updatedTeams: Team[] = [];

      for (const teamId in teamScores) {
        const { teamName, totalScore } = teamScores[teamId];

        // Find team document
        const teamsRef = collection(db, `sessions/${sessionId}/teams`);
        const teamQuery = query(teamsRef, where("name", "==", teamName));
        const teamSnapshot = await getDocs(teamQuery);

        if (!teamSnapshot.empty) {
          const teamDoc = teamSnapshot.docs[0];
          const teamRef = doc(db, `sessions/${sessionId}/teams/${teamDoc.id}`);

          // Update in Firestore batch
          batch.update(teamRef, {
            score: totalScore,
            updatedAt: serverTimestamp(),
          });

          // Add to updated teams array
          updatedTeams.push({
            id: teamDoc.id,
            name: teamName,
            score: totalScore,
            createdAt: teamDoc.data().createdAt,
          } as Team);
        }
      }

      // Commit the batch
      await batch.commit();

      // Sort teams by score (descending)
      updatedTeams.sort((a, b) => b.score - a.score);

      // Update local state
      setTeams(updatedTeams);
      setShowLeaderboard(true);

      alert("Final scores updated successfully!");
    } catch (err) {
      console.error("Error updating final scores:", err);
      alert("Failed to update final scores. Please try again.");
    } finally {
      setIsUpdatingScores(false);
    }
  };

  // Group submissions by question
  const getSubmissionsByQuestion = () => {
    const grouped: Record<string, Submission[]> = {};

    submissions.forEach((submission) => {
      const questionId = submission.questionId;
      if (!grouped[questionId]) {
        grouped[questionId] = [];
      }
      grouped[questionId].push(submission);
    });

    return grouped;
  };

  // Get question by ID
  const getQuestionById = (questionId: string) => {
    return questions.find((q) => q.id === questionId) || null;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "correct":
        return <CheckCircle size={16} className="text-green-500" />;
      case "incorrect":
        return <XCircle size={16} className="text-red-500" />;
      case "partial":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "marked":
        return <CheckCircle size={16} className="text-blue-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">Loading session data...</div>
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

  const submissionsByQuestion = getSubmissionsByQuestion();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage & Mark Session</h1>
        <div className="text-sm px-3 py-1 rounded-full bg-gray-800">
          Session ID: {sessionId}
        </div>
      </div>

      {/* Leaderboard */}
      {showLeaderboard && teams.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Award size={20} className="text-yellow-500" />
              Leaderboard
            </h2>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Hide
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-left">
                  <th className="p-3 border-b border-gray-700">Rank</th>
                  <th className="p-3 border-b border-gray-700">Team</th>
                  <th className="p-3 border-b border-gray-700 text-right">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr
                    key={team.id}
                    className={`border-b border-gray-800 ${
                      index === 0
                        ? "bg-yellow-900/20"
                        : index === 1
                          ? "bg-gray-800/50"
                          : index === 2
                            ? "bg-amber-900/20"
                            : ""
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-gray-900"
                              : index === 1
                                ? "bg-gray-400 text-gray-900"
                                : index === 2
                                  ? "bg-amber-700 text-gray-200"
                                  : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{team.name}</td>
                    <td className="p-3 text-right font-bold">{team.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update scores button */}
      <div className="flex justify-end">
        <button
          onClick={updateFinalScores}
          disabled={isUpdatingScores}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            isUpdatingScores
              ? "bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-white"
          }`}
        >
          <RefreshCw
            size={16}
            className={isUpdatingScores ? "animate-spin" : ""}
          />
          <span>
            {isUpdatingScores
              ? "Updating..."
              : "Update Final Scores & Leaderboard"}
          </span>
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{session?.name}</h2>

        {questions.length === 0 ? (
          <div className="text-center p-8 text-gray-400">
            No questions found for this session.
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center p-8 text-gray-400">
            No submissions received yet.
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((question, index) => {
              const questionSubmissions =
                submissionsByQuestion[question.id] || [];
              const isConciseCode = question.type === "concise_code";
              const hasMarkedSubmissions = questionSubmissions.some(
                (sub) => sub.status === "marked"
              );

              return (
                <div
                  key={question.id}
                  className="border border-gray-800 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-800 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-medium">
                          Question {index + 1}
                        </span>
                        <span className="bg-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                          {question.type}
                        </span>
                        <span className="bg-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                          {question.points} points
                        </span>
                      </div>

                      {/* Concise code bonus button */}
                      {isConciseCode && hasMarkedSubmissions && (
                        <button
                          onClick={() => calculateConciseBonus(question.id)}
                          disabled={processingQuestionId === question.id}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                            processingQuestionId === question.id
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-green-900/30 hover:bg-green-900/50 text-green-400"
                          }`}
                        >
                          <Calculator size={14} />
                          <span>
                            {processingQuestionId === question.id
                              ? "Processing..."
                              : "Calculate Concise Bonus"}
                          </span>
                        </button>
                      )}
                    </div>
                    <h3 className="text-lg font-medium">{question.title}</h3>
                  </div>

                  <div className="p-4">
                    {questionSubmissions.length === 0 ? (
                      <div className="text-center p-4 text-gray-400">
                        No submissions for this question.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-left text-sm text-gray-400">
                              <th className="p-2">Team</th>
                              <th className="p-2">Submitted At</th>
                              <th className="p-2">Status</th>
                              <th className="p-2">Score</th>
                              <th className="p-2">Bonus</th>
                              <th className="p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {questionSubmissions.map((submission) => (
                              <tr
                                key={submission.id}
                                className="border-t border-gray-800 hover:bg-gray-800/50"
                              >
                                <td className="p-2 font-medium">
                                  {submission.teamName}
                                </td>
                                <td className="p-2 text-sm">
                                  {submission.submittedAt?.toDate
                                    ? formatDate(
                                        submission.submittedAt.toDate()
                                      )
                                    : "N/A"}
                                </td>
                                <td className="p-2">
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(submission.status)}
                                    <span className="text-sm capitalize">
                                      {submission.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2">
                                  {submission.score !== undefined ? (
                                    <span className="font-mono">
                                      {submission.score}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-sm">
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="p-2">
                                  {submission.conciseBonus ? (
                                    <span className="text-green-400 font-mono">
                                      +{submission.conciseBonus}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-sm">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="p-2">
                                  {(question.type === "edit_code" ||
                                    question.type === "concise_code" ||
                                    question.type === "explain_code") && (
                                    <button
                                      onClick={() =>
                                        handleMarkSubmission(submission)
                                      }
                                      className="flex items-center gap-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-md text-sm"
                                    >
                                      <FileCode size={14} />
                                      <span>Mark</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSubmission && (
        <MarkingDialog
          isOpen={isMarkingDialogOpen}
          onClose={() => {
            setIsMarkingDialogOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          question={getQuestionById(selectedSubmission.questionId)}
          onSaveScore={handleSaveScore}
        />
      )}
    </div>
  );
}

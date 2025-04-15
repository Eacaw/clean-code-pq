"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/types";
import CountdownTimer from "./countdown-timer";
import MCQInput from "./inputs/mcq-input";
import CodeInput from "./inputs/code-input";
import QAInput from "./inputs/qa-input";
import CodeBlock from "./code-block";

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  sessionId: string;
  teamInfo: {
    teamId: string;
    teamName: string;
  };
  currentQuestionIndex: number;
  currentQuestionStartTime: Date;
  onSubmissionComplete: () => void;
}

export default function QuestionDisplay({
  question,
  questionNumber,
  sessionId,
  teamInfo,
  currentQuestionIndex,
  currentQuestionStartTime,
  onSubmissionComplete,
}: QuestionDisplayProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [answer, setAnswer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize default answer based on question type
  useEffect(() => {
    if (question.type === "mcq") {
      setAnswer(null); // No option selected initially
    } else if (
      question.type === "edit_code" ||
      question.type === "concise_code"
    ) {
      setAnswer(question.initialCode || "");
    } else if (question.type === "qa" || question.type === "explain_code") {
      setAnswer("");
    }

    // Reset submission state when question changes
    setIsSubmitted(false);
    setError(null);
  }, [question]);

  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate answer
      if (question.type === "mcq" && answer === null) {
        setError("Please select an option");
        setIsSubmitting(false);
        return;
      }

      // Prepare submission data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let submissionData: any = {
        teamId: teamInfo.teamId,
        teamName: teamInfo.teamName,
        questionId: question.id,
        questionIndex: currentQuestionIndex,
        questionType: question.type,
        submittedAt: serverTimestamp(),
        status: "pending",
        score: 0,
      };

      // Add type-specific data and perform automatic scoring for MCQ and QA
      if (question.type === "mcq") {
        const isCorrect = answer === question.correctOptionIndex;
        submissionData = {
          ...submissionData,
          selectedOptionIndex: answer,
          status: isCorrect ? "correct" : "incorrect",
          score: isCorrect ? question.points : 0,
        };
      } else if (question.type === "qa") {
        // Get the correct answer from the question
        const correctAnswer = question.correctAnswer || "";

        // Create a regex for flexible matching (case insensitive, ignore extra whitespace)
        const regex = new RegExp(
          `^\\s*${correctAnswer.trim().replace(/\s+/g, "\\s+")}\\s*$`,
          "i"
        );

        // Check if the answer matches
        const isCorrect = regex.test(answer);

        submissionData = {
          ...submissionData,
          answer: answer,
          status: isCorrect ? "correct" : "incorrect",
          score: isCorrect ? question.points : 0,
        };
      } else if (
        question.type === "edit_code" ||
        question.type === "concise_code"
      ) {
        submissionData = {
          ...submissionData,
          code: answer,
          // For code questions, status remains "pending" until manually marked
        };
      } else if (question.type === "explain_code") {
        submissionData = {
          ...submissionData,
          explanation: answer,
        };
      }

      // Write to Firestore
      const submissionsRef = collection(
        db,
        `sessions/${sessionId}/submissions`
      );
      await addDoc(submissionsRef, submissionData);

      setIsSubmitted(true);
      onSubmissionComplete();
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimerEnd = () => {
    if (!isSubmitted) {
      handleSubmit();
    }
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case "mcq":
        return (
          <MCQInput
            options={question.options || []}
            selectedOption={answer}
            onChange={setAnswer}
            isDisabled={isSubmitted}
          />
        );
      case "edit_code":
        return (
          <CodeInput
            initialCode={answer}
            onChange={setAnswer}
            isDisabled={isSubmitted}
            placeholder="Edit the code here..."
          />
        );
      case "concise_code":
        return (
          <CodeInput
            initialCode={answer}
            onChange={setAnswer}
            isDisabled={isSubmitted}
            placeholder="Write your code here..."
          />
        );
      case "qa":
        return (
          <QAInput
            value={answer}
            onChange={setAnswer}
            isDisabled={isSubmitted}
          />
        );
      case "explain_code":
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-300 mb-2">
                Code to Explain:
              </h3>
              <CodeBlock codeString={question.initialCode} />
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-gray-300 mb-2">Instructions:</h3>
              <p>{question.instructions}</p>
            </div>

            <div>
              <label
                htmlFor="explanation"
                className="block text-sm font-medium mb-2"
              >
                Your Explanation:
              </label>
              <textarea
                id="explanation"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Explain the code here..."
              />
            </div>
          </div>
        );
      default:
        return <div>Unknown question type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-primary/20 text-primary px-2 py-1 rounded-md text-sm font-medium">
            Question {questionNumber}
          </span>
          <span className="bg-gray-800 px-2 py-1 rounded-md text-sm font-medium">
            {question.points} points
          </span>
          <span className="bg-gray-800 px-2 py-1 rounded-md text-sm font-medium">
            {question.type}
          </span>
          <CountdownTimer
            startTime={currentQuestionStartTime}
            duration={question.timeLimit}
            onTimerEnd={handleTimerEnd}
            isDisabled={isSubmitted}
          />
        </div>

        <h2 className="text-xl font-bold mb-2">{question.title}</h2>
        <p className="text-gray-300 whitespace-pre-line">
          {question.description}
        </p>

        {question.instructions && (
          <div className="mt-4 p-3 bg-gray-800 border-l-4 border-primary rounded-r-md">
            <h3 className="font-medium mb-1">Instructions:</h3>
            <p className="text-gray-300 whitespace-pre-line">
              {question.instructions}
            </p>
          </div>
        )}

        {/* Add image display if question has an imageUrl */}
        {question.imageUrl && (
          <div className="mt-4 mb-6">
            <Image
              src={question.imageUrl}
              alt="Question image"
              className="max-w-full h-auto rounded-lg mx-auto"
              width={500}
              height={300}
              style={{ maxHeight: "300px" }}
            />
          </div>
        )}
      </div>

      {/* Dynamic input based on question type */}
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
        {renderQuestionContent()}

        {error && <div className="mt-4 text-red-400">{error}</div>}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isSubmitted}
            className={`px-4 py-2 rounded-md font-medium ${
              isSubmitted
                ? "bg-green-900/50 text-green-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            {isSubmitting
              ? "Submitting..."
              : isSubmitted
                ? "Submitted"
                : "Submit Answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

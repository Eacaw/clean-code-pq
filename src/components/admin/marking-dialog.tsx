"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Question, Submission } from "@/types";
import StarRating from "./star-rating";

interface MarkingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  question: Question | null;
  onSaveScore: (
    submissionId: string,
    criteria: Record<string, number | undefined>
  ) => void;
}

export default function MarkingDialog({
  isOpen,
  onClose,
  submission,
  question,
  onSaveScore,
}: MarkingDialogProps) {
  const isExplainCode = question?.type === "explain_code";
  const isQA = question?.type === "qa";
  const [criteria, setCriteria] = useState<Record<string, number | undefined>>(
    isExplainCode
      ? {
          explanationScore: submission.criteria?.explanationScore || 0,
        }
      : isQA
        ? {
            correctAnswer: 0,
          }
        : {
            readability: submission.criteria?.readability || 0,
            maintainability: submission.criteria?.maintainability || 0,
            elegance: submission.criteria?.elegance || 0,
            languageKnowledge: submission.criteria?.languageKnowledge || 0,
            simplicity: submission.criteria?.simplicity || 0,
          }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent background scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !question) return null;

  const handleRatingChange = (criterionName: string, value: number) => {
    setCriteria((prev) => ({
      ...prev,
      [criterionName]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSaveScore(submission.id, criteria);
    setIsSubmitting(false);
  };

  // Handler for clicking outside the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Calculate total score based on the question type
  const totalScore = Object.values(criteria).reduce((sum, score) => {
    return ((sum as number) ?? 0) + (typeof score === "number" ? score : 0);
  }, 0);
  // Set max score based on question type
  const maxPossibleScore = isExplainCode ? 5 : isQA ? 1 : 25; // 5 for explain_code, 5×5 for other types

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Mark Submission</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
          {/* Left panel - Submission details */}
          <div className="md:w-3/5 p-4 overflow-y-auto border-r border-gray-800">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{question.title}</h3>
                <p className="text-sm text-gray-400">
                  Team:{" "}
                  <span className="text-primary font-medium">
                    {submission.teamName}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">
                  {isExplainCode
                    ? "Submitted Explanation:"
                    : isQA
                      ? "Submitted Answer"
                      : "Submitted Code:"}
                </h4>
                <div className="bg-gray-950 p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                    {isExplainCode
                      ? submission.explanation
                      : isQA
                        ? submission.answer
                        : submission.code}
                  </pre>
                </div>
              </div>

              {question.correctAnswer && (
                <div className="space-y-2">
                  <h4 className="font-medium">Correct Answer:</h4>
                  <div className="bg-gray-800 p-4 rounded-md">
                    <p className="text-sm text-gray-300 whitespace-pre-line">
                      {isQA
                        ? question.correctAnswer
                        : question.correctAnswer
                            .split("\n")
                            .map((line, index) => (
                              <span key={index}>
                                {line}
                                <br />
                              </span>
                            ))}
                    </p>
                  </div>
                </div>
              )}

              {question.scoringCriteria && (
                <div className="space-y-2">
                  <h4 className="font-medium">Scoring Criteria:</h4>
                  <div className="bg-gray-800 p-4 rounded-md">
                    <p className="text-sm text-gray-300 whitespace-pre-line">
                      {question.scoringCriteria}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Scoring */}
          <div className="md:w-2/5 p-4 overflow-y-auto bg-gray-800/50">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Scoring</h3>
                <p className="text-sm text-gray-400">
                  {isExplainCode
                    ? "Rate the explanation from 0 to 5 stars based on how well it matches the scoring criteria."
                    : "Rate each criterion from 0 to 5 stars. The total score will be the sum of all ratings."}
                </p>
              </div>

              <div className="space-y-4">
                {isExplainCode ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Explanation Quality
                    </label>
                    <StarRating
                      value={
                        typeof criteria.explanationScore === "number"
                          ? criteria.explanationScore
                          : 0
                      }
                      onChange={(value) =>
                        handleRatingChange("explanationScore", value)
                      }
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      How well does the explanation match the scoring criteria?
                    </p>
                  </div>
                ) : isQA ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Correct Answer
                    </label>
                    <input
                      type="checkbox"
                      checked={!!criteria.correctAnswer}
                      onChange={(e) =>
                        setCriteria((prev) => ({
                          ...prev,
                          correctAnswer: e.target.checked ? 1 : 0,
                        }))
                      }
                      className="mr-2 accent-primary"
                      id="correct-answer-checkbox"
                    />
                    <label
                      htmlFor="correct-answer-checkbox"
                      className="text-sm"
                    >
                      Mark as correct
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Is the answer correct?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Readability
                      </label>
                      <StarRating
                        value={
                          typeof criteria.readability === "number"
                            ? criteria.readability
                            : 0
                        }
                        onChange={(value) =>
                          handleRatingChange("readability", value)
                        }
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        How easy is the code to read and understand at a glance?
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Maintainability
                      </label>
                      <StarRating
                        value={
                          typeof criteria.maintainability === "number"
                            ? criteria.maintainability
                            : 0
                        }
                        onChange={(value) =>
                          handleRatingChange("maintainability", value)
                        }
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        How easy would it be to modify or extend this code?
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Elegance
                      </label>
                      <StarRating
                        value={
                          typeof criteria.elegance === "number"
                            ? criteria.elegance
                            : 0
                        }
                        onChange={(value) =>
                          handleRatingChange("elegance", value)
                        }
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        How clever or elegant is the solution? Does it show
                        insight?
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Language Knowledge
                      </label>
                      <StarRating
                        value={
                          typeof criteria.languageKnowledge === "number"
                            ? criteria.languageKnowledge
                            : 0
                        }
                        onChange={(value) =>
                          handleRatingChange("languageKnowledge", value)
                        }
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        How well does it demonstrate knowledge of language
                        features?
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Simplicity
                      </label>
                      <StarRating
                        value={
                          typeof criteria.simplicity === "number"
                            ? criteria.simplicity
                            : 0
                        }
                        onChange={(value) =>
                          handleRatingChange("simplicity", value)
                        }
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Is the solution appropriately simple without unnecessary
                        complexity?
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total Score:</span>
                    <span className="text-xl font-bold">
                      {totalScore} / {maxPossibleScore}
                    </span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium"
                  >
                    {isSubmitting ? "Saving..." : "Save Score"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

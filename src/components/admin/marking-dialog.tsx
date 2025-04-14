"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Question, Submission } from "@/types";
import StarRating from "./star-rating";

interface MarkingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  question: Question | null;
  onSaveScore: (submissionId: string, criteria: Record<string, number>) => void;
}

export default function MarkingDialog({
  isOpen,
  onClose,
  submission,
  question,
  onSaveScore,
}: MarkingDialogProps) {
  const isExplainCode = question?.type === "explain_code";
  const [criteria, setCriteria] = useState(
    isExplainCode
      ? {
          explanationScore: submission.criteria?.explanationScore || 0,
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

  // Calculate total score based on the question type
  const totalScore = Object.values(criteria).reduce(
    (sum, score) => sum + score,
    0
  );
  // Set max score based on question type
  const maxPossibleScore = isExplainCode ? 5 : 25; // 5 for explain_code, 5×5 for other types

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
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
                  {isExplainCode ? "Submitted Explanation:" : "Submitted Code:"}
                </h4>
                <div className="bg-gray-950 p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                    {isExplainCode ? submission.explanation : submission.code}
                  </pre>
                </div>
              </div>

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
                      value={criteria.explanationScore}
                      onChange={(value) =>
                        handleRatingChange("explanationScore", value)
                      }
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      How well does the explanation match the scoring criteria?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Readability
                      </label>
                      <StarRating
                        value={criteria.readability}
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
                        value={criteria.maintainability}
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
                        value={criteria.elegance}
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
                        value={criteria.languageKnowledge}
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
                        value={criteria.simplicity}
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

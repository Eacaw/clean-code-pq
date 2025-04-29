"use client";

import type React from "react";

import { useState, type ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/types";
import RequiredLabel from "./required-label";

interface QuestionFormProps {
  question: Partial<Question>;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

export default function QuestionForm({
  question,
  isSubmitting,
  setIsSubmitting,
  onCancel,
  mode,
}: QuestionFormProps) {
  const router = useRouter();

  // Set default time limit based on question type
  const getDefaultTimeLimit = (type: string | undefined) => {
    switch (type) {
      case "mcq":
        return 30;
      case "qa":
        return 45;
      case "concise_code":
        return 300;
      case "explain_code":
        return 180;
      case "edit_code":
        return 300;
      default:
        return 30;
    }
  };

  const [formData, setFormData] = useState<Partial<Question>>({
    ...question,
    points: 5,
    timeLimit: getDefaultTimeLimit(question.type),
  });

  // Update time limit when question type changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      timeLimit: getDefaultTimeLimit(formData.type),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type]);

  const [acceptedAnswerExamples, setAcceptedAnswerExamples] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (formData.type === "qa" && formData.correctAnswer) {
      generateAcceptedAnswerExamples(formData.correctAnswer);
    }
  }, [formData.correctAnswer, formData.type]);

  const generateAcceptedAnswerExamples = (correctAnswer: string) => {
    if (!correctAnswer.trim()) {
      setAcceptedAnswerExamples([]);
      return;
    }

    const trimmedAnswer = correctAnswer.trim();

    const examples = [
      `  ${trimmedAnswer}  `,
      trimmedAnswer.toUpperCase(),
      trimmedAnswer.toLowerCase(),
      `  ${trimmedAnswer.toLowerCase()}  `,
    ];

    setAcceptedAnswerExamples(Array.from(new Set(examples)));
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log("{ name, value }:", { name, value });

    if (name === "timeLimit" || name === "correctOptionIndex") {
      setFormData({
        ...formData,
        [name]: Number.parseInt(value, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...(formData.options || ["", "", ""])];
    updatedOptions[index] = value;

    setFormData({
      ...formData,
      options: updatedOptions,
    });
  };

  const handleQuickTimeSelect = (minutes: number) => {
    setFormData({
      ...formData,
      timeLimit: minutes * 60, // Convert minutes to seconds
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseQuestionData = {
        ...formData,
        points: 5, // Always set points to 5
        timeLimit: Number(formData.timeLimit),
      };

      let questionData: Partial<Question>;

      if (formData.type === "mcq") {
        questionData = {
          ...baseQuestionData,
          correctOptionIndex: Number(formData.correctOptionIndex),
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctOptionIndex, ...otherData } = baseQuestionData;
        questionData = otherData;
      }

      if (mode === "create") {
        await addDoc(collection(db, "questions"), questionData);
      } else if (mode === "edit" && question.id) {
        await updateDoc(doc(db, "questions", question.id), questionData);
      }

      router.push("/admin/questions");
      router.refresh();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-gray-900 p-6 rounded-lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <RequiredLabel htmlFor="type" required>
                Question Type
              </RequiredLabel>
              <select
                id="type"
                name="type"
                value={formData.type || "mcq"}
                onChange={handleChange}
                required
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="edit_code">Edit Code</option>
                <option value="explain_code">Explain This Code</option>
                <option value="concise_code">Concise Code</option>
                <option value="qa">Question & Answer</option>
              </select>
            </div>

            <div>
              <RequiredLabel htmlFor="title" required>
                Question Title
              </RequiredLabel>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title || ""}
                onChange={handleChange}
                required
                placeholder="Enter a clear, concise title for the question..."
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <RequiredLabel htmlFor="timeLimit" required>
                Time Limit (seconds)
              </RequiredLabel>
              <div className="flex gap-2">
                <input
                  id="timeLimit"
                  name="timeLimit"
                  type="number"
                  min="0"
                  value={formData.timeLimit || 0}
                  onChange={handleChange}
                  required
                  placeholder="Time in seconds..."
                  className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickTimeSelect(1)}
                    className="px-1 py-1 bg-gray-700 hover:bg-gray-600 text-xs font-medium rounded"
                  >
                    1m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTimeSelect(2)}
                    className="px-1 py-1 bg-gray-700 hover:bg-gray-600 text-xs font-medium rounded"
                  >
                    2m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTimeSelect(5)}
                    className="px-1 py-1 bg-gray-700 hover:bg-gray-600 text-xs font-medium rounded"
                  >
                    5m
                  </button>
                </div>
              </div>
            </div>

            <div>
              <RequiredLabel htmlFor="description">Description</RequiredLabel>
              <textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Optional description or context for the question..."
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <RequiredLabel htmlFor="imageUrl">
                Image URL (Optional)
              </RequiredLabel>
              <input
                id="imageUrl"
                name="imageUrl"
                type="text"
                value={formData.imageUrl || ""}
                onChange={handleChange}
                placeholder="Enter URL to an image..."
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-400 mt-1">
                Paste a direct link to an image that will be displayed with the
                question
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {formData.type === "mcq" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Multiple Choice Options</h3>

                {(formData.options || ["", "", ""]).map((option, index) => (
                  <div key={index}>
                    <RequiredLabel required>Option {index + 1}</RequiredLabel>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      required
                      placeholder={`Enter option ${index + 1}...`}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                ))}

                <div>
                  <RequiredLabel htmlFor="correctOptionIndex" required>
                    Correct Option
                  </RequiredLabel>
                  <select
                    id="correctOptionIndex"
                    name="correctOptionIndex"
                    value={formData.correctOptionIndex || 0}
                    onChange={handleChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                  >
                    {(formData.options || ["", "", ""]).map((_, index) => (
                      <option key={index} value={index}>
                        Option {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formData.type === "edit_code" && (
              <div className="space-y-4">
                <div>
                  <RequiredLabel htmlFor="initialCode" required>
                    Initial Code
                  </RequiredLabel>
                  <textarea
                    id="initialCode"
                    name="initialCode"
                    value={formData.initialCode || ""}
                    onChange={handleChange}
                    rows={6}
                    required
                    placeholder="Enter the starting code that needs to be edited..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary font-mono text-sm"
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="instructions" required>
                    Instructions
                  </RequiredLabel>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={formData.instructions || ""}
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="Provide clear instructions on what to edit in the code..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="scoringCriteria" required>
                    Scoring Criteria
                  </RequiredLabel>
                  <textarea
                    id="scoringCriteria"
                    name="scoringCriteria"
                    value={formData.scoringCriteria || ""}
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="List the criteria that will be used to score the edited code..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            )}

            {formData.type === "concise_code" && (
              <div className="space-y-4">
                <div>
                  <RequiredLabel htmlFor="initialCode" required>
                    Initial Code
                  </RequiredLabel>
                  <textarea
                    id="initialCode"
                    name="initialCode"
                    value={formData.initialCode || ""}
                    onChange={handleChange}
                    rows={6}
                    required
                    placeholder="Enter the verbose code that needs to be made more concise..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary font-mono text-sm"
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="instructions" required>
                    Instructions
                  </RequiredLabel>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={formData.instructions || ""}
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="Explain what should be improved in terms of conciseness..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            )}

            {formData.type === "qa" && (
              <div className="space-y-3">
                <RequiredLabel htmlFor="correctAnswer" required>
                  Correct Answer
                </RequiredLabel>
                <input
                  id="correctAnswer"
                  name="correctAnswer"
                  type="text"
                  value={formData.correctAnswer || ""}
                  onChange={handleChange}
                  required
                  placeholder="Enter the correct answer (for regex matching)..."
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-400">
                  This will be used for regex matching to check answers.
                </p>

                {formData.correctAnswer &&
                  acceptedAnswerExamples.length > 0 && (
                    <div className="mt-3 p-3 border border-gray-700 rounded-md bg-gray-800/50">
                      <p className="text-sm font-medium text-gray-300 mb-2">
                        Examples of answers that would be accepted:
                      </p>
                      <ul className="space-y-1 text-xs text-gray-400">
                        {acceptedAnswerExamples.map((example, index) => (
                          <li
                            key={index}
                            className="font-mono bg-gray-900 px-2 py-1 rounded"
                          >
                            &quot;{example}&quot;
                          </li>
                        ))}
                        <li className="text-gray-500 italic mt-2">
                          Note: Answers are matched ignoring case and extra
                          whitespace
                        </li>
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {formData.type === "explain_code" && (
              <div className="space-y-4">
                <div>
                  <RequiredLabel htmlFor="initialCode" required>
                    Code to Explain
                  </RequiredLabel>
                  <textarea
                    id="initialCode"
                    name="initialCode"
                    value={formData.initialCode || ""}
                    onChange={handleChange}
                    rows={6}
                    required
                    placeholder="Enter the code snippet that needs to be explained..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary font-mono text-sm"
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="instructions" required>
                    Instructions
                  </RequiredLabel>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={formData.instructions || ""}
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="Provide instructions on what aspects of the code should be explained..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="scoringCriteria" required>
                    Scoring Criteria
                  </RequiredLabel>
                  <textarea
                    id="scoringCriteria"
                    name="scoringCriteria"
                    value={formData.scoringCriteria || ""}
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="Detail how responses will be scored, e.g., key points that should be mentioned..."
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Question"
                : "Update Question"}
          </button>
        </div>
      </form>
    </>
  );
}

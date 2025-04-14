"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuestionForm from "@/components/admin/question-form";
import type { Question } from "@/types";

export default function NewQuestionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialQuestion: Partial<Question> = {
    title: "",
    description: "",
    type: "mcq",
    points: 5,
    timeLimit: 60,
    imageUrl: "",
    options: ["", "", ""],
    correctOptionIndex: 0,
    correctAnswer: "",
    initialCode: "",
    instructions: "",
    scoringCriteria: "",
  };

  const handleCancel = () => {
    router.push("/admin/questions");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Question</h1>

      <QuestionForm
        question={initialQuestion}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        onCancel={handleCancel}
        mode="create"
      />
    </div>
  );
}

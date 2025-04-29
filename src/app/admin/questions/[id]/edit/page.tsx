"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import QuestionForm from "@/components/admin/question-form";
import type { Question } from "@/types";

export default function EditQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const docRef = doc(db, "questions", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setQuestion({
            id: docSnap.id,
            ...docSnap.data(),
          } as Question);
        } else {
          setError("Question not found");
        }
      } catch (err) {
        console.error("Error fetching question:", err);
        setError("Failed to load question. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [params.id]);

  const handleCancel = () => {
    router.push("/admin/questions");
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading question...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>;
  }

  if (!question) {
    return <div className="text-red-500 p-8">Question not found</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Question</h1>

      <QuestionForm
        question={question}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        onCancel={handleCancel}
        mode="edit"
      />
    </div>
  );
}

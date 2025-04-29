"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/types";

export default function QuestionDetail({ params }: { params: { id: string } }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const docRef = doc(db, "questions", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setQuestion(docSnap.data() as Question);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching question:", error);
      }
    };

    fetchQuestion();
  }, [params.id]);

  if (!question) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
      <div className="mb-4">
        <span className="bg-gray-700 text-xs px-2 py-1 rounded text-gray-100 font-medium mr-2">
          {question.type}
        </span>
        <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded font-medium">
          {question.topic}
        </span>
      </div>
      <p className="text-gray-300 mb-4">{question.description}</p>
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt={question.title}
          className="w-full h-auto rounded-lg mb-4"
        />
      )}
      {/* Additional question details can be added here */}
      <button
        onClick={() => router.push("/admin/questions")}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md"
      >
        Back to Questions
      </button>
    </div>
  );
}

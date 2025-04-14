"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { QuestionBase } from "@/types"

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const questionsCollection = collection(db, "questions")
        const querySnapshot = await getDocs(questionsCollection)

        const fetchedQuestions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QuestionBase[]

        setQuestions(fetchedQuestions)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching questions:", err)
        setError("Failed to load questions. Please try again.")
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteDoc(doc(db, "questions", id))
        setQuestions(questions.filter((question) => question.id !== id))
      } catch (err) {
        console.error("Error deleting question:", err)
        alert("Failed to delete question. Please try again.")
      }
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading questions...</div>
  }

  if (error) {
    return <div className="text-red-500 p-8">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Question Management</h1>
        <Link
          href="/admin/questions/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
        >
          <PlusCircle size={18} />
          <span>Add Question</span>
        </Link>
      </div>

      {questions.length === 0 ? (
        <div className="text-center p-8 bg-gray-900 rounded-lg">
          <p className="text-gray-400">No questions found. Create your first question!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900 text-left">
                <th className="p-4 border-b border-gray-800">Title</th>
                <th className="p-4 border-b border-gray-800">Type</th>
                <th className="p-4 border-b border-gray-800">Points</th>
                <th className="p-4 border-b border-gray-800">Time Limit</th>
                <th className="p-4 border-b border-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                  <td className="p-4">{question.title}</td>
                  <td className="p-4">{question.type}</td>
                  <td className="p-4">{question.points}</td>
                  <td className="p-4">{question.timeLimit}s</td>
                  <td className="p-4 flex gap-2">
                    <Link
                      href={`/admin/questions/${question.id}/edit`}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-md"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

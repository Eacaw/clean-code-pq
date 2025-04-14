"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Question, Session } from "@/types"
import { X } from "lucide-react"

interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSessionCreated: (session: Session) => void
}

export default function CreateSessionModal({ isOpen, onClose, onSessionCreated }: CreateSessionModalProps) {
  const [sessionName, setSessionName] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const questionsCollection = collection(db, "questions")
        const querySnapshot = await getDocs(questionsCollection)

        const fetchedQuestions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Question[]

        setQuestions(fetchedQuestions)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching questions:", err)
        setError("Failed to load questions. Please try again.")
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchQuestions()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionName.trim()) {
      setError("Session name is required")
      return
    }

    if (selectedQuestionIds.length === 0) {
      setError("Please select at least one question")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const sessionData = {
        name: sessionName.trim(),
        questionIds: selectedQuestionIds,
        status: "pending",
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "sessions"), sessionData)

      // Create the session object to return
      const newSession: Session = {
        id: docRef.id,
        ...sessionData,
        createdAt: new Date(), // Use a JS Date for the local state
      }

      onSessionCreated(newSession)
      onClose()
    } catch (err) {
      console.error("Error creating session:", err)
      setError("Failed to create session. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([])
    } else {
      setSelectedQuestionIds(questions.map((q) => q.id))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Create New Session</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="p-4 space-y-4 flex-grow overflow-y-auto">
            <div>
              <label htmlFor="sessionName" className="block text-sm font-medium mb-1">
                Session Name
              </label>
              <input
                id="sessionName"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Enter session name"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Select Questions</label>
                <button type="button" onClick={handleSelectAll} className="text-xs text-primary hover:underline">
                  {selectedQuestionIds.length === questions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {loading ? (
                <div className="text-center p-4">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="text-center p-4 bg-gray-800 rounded-md">
                  No questions available. Please create questions first.
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto p-2 bg-gray-800 rounded-md">
                  {questions.map((question) => (
                    <div key={question.id} className="flex items-center p-2 hover:bg-gray-700 rounded-md">
                      <input
                        type="checkbox"
                        id={`question-${question.id}`}
                        checked={selectedQuestionIds.includes(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`question-${question.id}`} className="flex-grow cursor-pointer">
                        <div className="font-medium">{question.title}</div>
                        <div className="text-xs text-gray-400">
                          {question.type} • {question.points} points • {question.timeLimit}s
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>

          <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md"
              disabled={submitting || loading}
            >
              {submitting ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

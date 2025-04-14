"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { FcGoogle } from "react-icons/fc"

export default function AdminLogin() {
  const { user, isAdmin, isLoading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.push("/admin")
    }
  }, [isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

        <div className="space-y-4">
          <p className="text-gray-400 text-center">Sign in with your admin Google account to access the dashboard.</p>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-4 py-3 rounded-md font-medium transition-colors"
          >
            <FcGoogle size={20} />
            <span>Sign in with Google</span>
          </button>

          {user && !isAdmin && (
            <div className="text-red-500 text-center mt-4">
              You do not have admin privileges. Please sign in with an admin account.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

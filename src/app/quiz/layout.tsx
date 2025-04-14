import type React from "react"
export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="py-6">{children}</div>
}

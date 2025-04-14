import { Trash2 } from "lucide-react";
import { deleteSession } from "@/lib/firebase/sessions";
import { useState } from "react";

interface SessionsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions: Array<{ id: string; [key: string]: any }>;
  onRefresh?: () => void;
}

export default function SessionsTable({
  sessions,
  onRefresh,
}: SessionsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteSession = async (sessionId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this session? This action cannot be undone."
      )
    ) {
      try {
        setIsDeleting(sessionId);
        await deleteSession(sessionId);
        onRefresh?.(); // Refresh the sessions list after deletion
      } catch (error) {
        console.error("Error deleting session:", error);
        alert("Failed to delete session. Please try again.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <table className="min-w-full divide-y divide-gray-800">
      <thead className="bg-gray-900">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            Session Name
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            Created At
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800 bg-gray-950">
        {sessions.map((session) => (
          <tr key={session.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
              {session.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
              {session.createdAt}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div className="flex justify-end items-center gap-2">
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  disabled={isDeleting === session.id}
                  className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-colors"
                  title="Delete session"
                >
                  {isDeleting === session.id ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

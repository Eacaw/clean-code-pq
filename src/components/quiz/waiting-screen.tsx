import { Clock } from "lucide-react";

interface WaitingScreenProps {
  isQuizComplete?: boolean;
}

export default function WaitingScreen({
  isQuizComplete = false,
}: WaitingScreenProps) {
  if (isQuizComplete) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3">
          Thank you for participating!
        </h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          You have completed all questions in this quiz. Your responses have
          been recorded.
        </p>
        <div className="bg-gray-800/50 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="font-medium mb-2">What happens next?</h3>
          <p className="text-sm text-gray-400">
            The presenter will share the results soon. Stay tuned for the final
            scores and correct answers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 mb-6">
        <Clock className="h-10 w-10 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Waiting for the next question</h2>
      <p className="text-gray-400 max-w-md mx-auto">
        Your answer has been submitted. Please wait while the presenter moves to
        the next question.
      </p>
    </div>
  );
}

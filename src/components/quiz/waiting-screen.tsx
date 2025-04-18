import { Clock } from "lucide-react";

interface WaitingScreenProps {
  isQuizComplete?: boolean;
  currentQuestionIndex?: number;
}

export default function WaitingScreen({
  isQuizComplete = false,
  currentQuestionIndex = 0,
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

  if (currentQuestionIndex === 0) {
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
              d="M13 16h-1v-4h-1m1-4h.01"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-3">Welcome to the Quiz!</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          Before we begin, here’s what you need to know:
        </p>
        <div className="bg-gray-800/50 rounded-lg p-6 max-w-xl mx-auto mb-6 text-left">
          <h3 className="font-medium mb-2">Instructions</h3>
          <table className="w-full text-sm text-gray-300 border-separate border-spacing-0">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left font-semibold pb-2 border-b border-gray-700">
                  Question Type
                </th>
                <th className="text-left font-semibold pb-2 border-b border-gray-700">
                  Description
                </th>
                <th className="text-left font-semibold pb-2 border-b border-gray-700">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="pr-4 align-top font-semibold py-2 border-b border-gray-800">
                  Multiple Choice
                </td>
                <td className="pr-4 align-top py-2 border-b border-gray-800">
                  Select the correct answer from the given options.
                </td>
                <td className="text-primary font-semibold align-top py-2 border-b border-gray-800 text-center">
                  5
                </td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="pr-4 align-top font-semibold py-2 border-b border-gray-800">
                  Q&amp;A
                </td>
                <td className="pr-4 align-top py-2 border-b border-gray-800">
                  Type your answer in the box provided. This will be a one or
                  two word answer.
                </td>
                <td className="text-primary font-semibold align-top py-2 border-b border-gray-800 text-center">
                  5
                </td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="pr-4 align-top font-semibold py-2 border-b border-gray-800">
                  Explain this code
                </td>
                <td className="pr-4 align-top py-2 border-b border-gray-800">
                  Analyse the code and provide an explanation based on the
                  question criteria
                </td>
                <td className="text-primary font-semibold align-top py-2 border-b border-gray-800 text-center">
                  5
                </td>
              </tr>
              <tr>
                <td className="pr-4 align-top font-semibold py-2">
                  Modify this code
                </td>
                <td className="pr-4 align-top py-2">
                  Update some existing code to improve it to follow clean code
                  principles.
                </td>
                <td className="text-primary font-semibold align-top py-2 text-center">
                  25
                </td>
              </tr>
              <tr>
                <td className="pr-4 align-top font-semibold py-2">
                  Concise Code
                </td>
                <td className="pr-4 align-top py-2">
                  Modify the code to make it more concise following clean code
                  principles.
                </td>
                <td className="text-primary font-semibold align-top py-2 text-center">
                  25
                </td>
              </tr>
              <tr>
                <td className="pr-4 align-top font-semibold py-2"></td>
                <td className="pr-4 align-top py-2">
                  The last two types will be scored by the judges based on the
                  following criteria:
                  <ul className="list-disc list-inside ml-8">
                    <li>Readability</li>
                    <li>Maintainability</li>
                    <li>Elegance</li>
                    <li>Language Knowledge</li>
                    <li>Simplicity</li>
                  </ul>
                </td>
                <td className="text-primary font-semibold align-top py-2 text-center">
                  5 Points per criterion
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-400 max-w-md mx-auto">
          Try your best on each question. Good luck!
        </p>
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

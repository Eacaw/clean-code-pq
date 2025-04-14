"use client"

interface QAInputProps {
  value: string
  onChange: (value: string) => void
  isDisabled: boolean
}

export default function QAInput({ value, onChange, isDisabled }: QAInputProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium mb-2">Your Answer:</h3>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        placeholder="Type your answer here..."
        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}

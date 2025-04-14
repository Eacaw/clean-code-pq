"use client"

interface CodeInputProps {
  initialCode: string
  onChange: (value: string) => void
  isDisabled: boolean
  placeholder?: string
}

export default function CodeInput({ initialCode, onChange, isDisabled, placeholder }: CodeInputProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium mb-2">Code:</h3>
      <textarea
        value={initialCode}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        placeholder={placeholder}
        className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded-md font-mono text-sm text-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
        spellCheck="false"
      />
    </div>
  )
}

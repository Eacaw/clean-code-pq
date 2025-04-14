"use client"

interface MCQInputProps {
  options: string[]
  selectedOption: number | null
  onChange: (value: number) => void
  isDisabled: boolean
}

export default function MCQInput({ options, selectedOption, onChange, isDisabled }: MCQInputProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium mb-2">Select the correct option:</h3>
      {options.map((option, index) => (
        <div
          key={index}
          onClick={() => !isDisabled && onChange(index)}
          className={`p-4 rounded-md border ${
            selectedOption === index
              ? "border-primary bg-primary/10 cursor-default"
              : isDisabled
                ? "border-gray-700 bg-gray-900/50 cursor-not-allowed"
                : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/30 cursor-pointer"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border ${
                selectedOption === index ? "border-primary" : "border-gray-600"
              } flex items-center justify-center`}
            >
              {selectedOption === index && <div className="w-3 h-3 rounded-full bg-primary"></div>}
            </div>
            <div className="text-gray-300">{option}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

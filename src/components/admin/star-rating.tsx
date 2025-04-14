"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  max?: number
}

export default function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const handleClick = (index: number) => {
    // If clicking the same star twice, toggle it off (set to 0)
    if (value === index + 1) {
      onChange(0)
    } else {
      onChange(index + 1)
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoverValue(index + 1)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  return (
    <div className="flex">
      {[...Array(max)].map((_, index) => {
        const isFilled = (hoverValue !== null ? hoverValue : value) > index

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            className={`p-1 focus:outline-none ${isFilled ? "text-yellow-400" : "text-gray-600"}`}
          >
            <Star size={20} fill={isFilled ? "currentColor" : "none"} />
          </button>
        )
      })}
    </div>
  )
}

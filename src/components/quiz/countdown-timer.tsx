"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  startTime: Date;
  duration: number; // in seconds
  onTimerEnd: () => void;
  isDisabled?: boolean;
}

export default function CountdownTimer({
  startTime,
  duration,
  onTimerEnd,
  isDisabled = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(calculateTimeLeft());
  const [isExpired, setIsExpired] = useState(false);

  function calculateTimeLeft(): number {
    const now = new Date();
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const diff = Math.max(
      0,
      Math.floor((endTime.getTime() - now.getTime()) / 1000)
    );
    return diff;
  }

  const calculateTimeLeftCallback = useCallback(calculateTimeLeft, [
    startTime,
    duration,
  ]);

  useEffect(() => {
    // Reset timer when start time changes
    // eslint-disable-next-line
    setTimeLeft(calculateTimeLeftCallback());
    setIsExpired(false);
  }, [startTime, duration, calculateTimeLeftCallback]);

  useEffect(() => {
    if (isDisabled) return;

    const timer = setInterval(() => {
      // eslint-disable-next-line
      const remaining = calculateTimeLeftCallback();
      setTimeLeft(remaining);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        onTimerEnd();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    startTime,
    duration,
    onTimerEnd,
    isExpired,
    isDisabled,
    calculateTimeLeftCallback,
  ]);

  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Determine color based on time left
  const getTimerColor = () => {
    if (isDisabled) return "text-gray-500";
    if (timeLeft <= 10) return "text-red-500";
    if (timeLeft <= 30) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800 ${getTimerColor()}`}
    >
      <Clock size={14} />
      <span className="text-sm font-mono">{formattedTime}</span>
    </div>
  );
}

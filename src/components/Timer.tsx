import React, { useEffect, useState, useRef, useCallback } from "react";
import { Timer as TimerIcon } from "lucide-react";

type TimerProps = {
  userId: string;
  quizId: string;
  onTimeUp: () => void;
  onWarn?: () => void;
};

const Timer: React.FC<TimerProps> = ({ userId, quizId, onTimeUp, onWarn }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timeLeftRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use refs to store callback functions to avoid dependency issues
  const onTimeUpRef = useRef(onTimeUp);
  const onWarnRef = useRef(onWarn);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    onWarnRef.current = onWarn;
  }, [onTimeUp, onWarn]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    const initTimer = async () => {
      try {
        const res = await fetch(
          `/api/quiz-remaining-time?userId=${userId}&quizId=${quizId}`
        );
        const data = await res.json();

        if (data.remainingSeconds === undefined) {
          console.error("No remainingSeconds returned from server");
          return;
        }

        setTimeLeft(data.remainingSeconds > 0 ? data.remainingSeconds : 0);
      } catch (error) {
        console.error("Failed to init timer", error);
      }
    };

    initTimer();
  }, [userId, quizId]);

  // ✅ Fixed countdown - using refs to avoid recreating interval
  useEffect(() => {
    if (timeLeft === null) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onTimeUpRef.current?.();
          return 0;
        }

        if (prev === 21) {
          onWarnRef.current?.();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timeLeft === null]); // Removed callback dependencies

  // ✅ Fixed heartbeat - stable interval
  useEffect(() => {
    if (timeLeft === null) return;

    const sendHeartbeat = async (remaining: number) => {
      try {
        await fetch("/api/quiz-session-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, quizId, remainingSeconds: remaining }),
        });
      } catch (err) {
        console.error("Failed to send heartbeat", err);
      }
    };

    // Clear any existing heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      const currentTime = timeLeftRef.current;
      if (currentTime && currentTime > 0) {
        sendHeartbeat(currentTime);
      }
    }, 30_000);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        // Send final heartbeat
        const currentTime = timeLeftRef.current;
        if (currentTime && currentTime > 0) {
          sendHeartbeat(currentTime);
        }
        heartbeatRef.current = null;
      }
    };
  }, [userId, quizId, timeLeft === null]); // Stable dependencies

  if (timeLeft === null) return <div>Loading timer...</div>;

  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  const timeTextClass = `text-xl transition-colors duration-500 ${
    timeLeft <= 300 ? "text-red-600" : ""
  }`;

  return (
    <div className="text-2xl font-bold flex items-center justify-center gap-3">
      <TimerIcon size={36} className="text-accent" />
      <div className="flex flex-col text-sm">
        <span>Time</span>
        <span>Left:</span>
      </div>
      <div className="w-[150px] flex items-center justify-center p-2 text-sm gap-2 bg-neutral-100 border border-neutral-300 rounded-md">
        <div className="flex flex-col items-center">
          <span className={timeTextClass}>
            {hrs.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] font-light">hrs</span>
        </div>
        <div>:</div>
        <div className="flex flex-col items-center">
          <span className={timeTextClass}>
            {mins.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] font-light">min</span>
        </div>
        <div>:</div>
        <div className="flex flex-col items-center">
          <span className={timeTextClass}>
            {secs.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] font-light">sec</span>
        </div>
      </div>
    </div>
  );
};

export default Timer;
import React, { useEffect, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";

interface TimerProps {
  userId: string;
  onTimeUp?: () => void;
}

const Timer: React.FC<TimerProps> = ({ userId, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0); 

  useEffect(() => {
    const syncTime = async () => {
      try {
        const [serverRes, endTimeRes] = await Promise.all([
          fetch("/api/server-time"),
          fetch(`/api/quiz-end-time?userId=${userId}`),
        ]);
        const serverData = await serverRes.json();
        const endTimeData = await endTimeRes.json();

        const clientNow = Date.now();
        const serverNow = serverData.serverTime;
        const offset = serverNow - clientNow; 

        setServerTimeOffset(offset);

        const remainingSeconds = Math.floor((endTimeData.endTime - serverNow) / 1000);
        setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
      } catch (error) {
        console.error("Failed to sync time", error);
      }
    };

    syncTime();
  }, [userId]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  if (timeLeft === null) return <div>Loading timer...</div>;

  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <div className="text-2xl font-bold flex items-center justify-center gap-3">
      <TimerIcon size={36} className="text-accent transition-transform duration-200 hover:scale-110" />
      <div className="flex flex-col text-sm">
        <span>Time</span>
        <span>Left:</span>
      </div>
      <div className="w-[150px] flex items-center justify-center p-2 text-sm gap-2 bg-neutral-100 border border-neutral-300 rounded-md">
        <div className="flex flex-col items-center justify-center">
          <span className="text-xl leading-4">{hrs.toString().padStart(2, "0")}</span>
          <span className="text-[10px] font-light">hrs</span>
        </div>
        <div>:</div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-xl leading-4">{mins.toString().padStart(2, "0")}</span>
          <span className="text-[10px] font-light">min</span>
        </div>
        <div>:</div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-xl leading-4">{secs.toString().padStart(2, "0")}</span>
          <span className="text-[10px] font-light">sec</span>
        </div>
      </div>
    </div>
  );
};

export default Timer;

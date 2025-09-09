import React, { useEffect, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";

type TimerProps = {
	userId: string;
	quizId: string;
	onTimeUp: () => void;
	onWarn?: () => void;
};

const Timer: React.FC<TimerProps> = ({ userId, quizId, onTimeUp, onWarn }) => {
	const [timeLeft, setTimeLeft] = useState<number | null>(null);

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

	// Countdown locally
	useEffect(() => {
		if (timeLeft === null) return;
		if (timeLeft <= 0) {
			onTimeUp?.();
			return;
		}

		if (timeLeft === 20) {
			onWarn?.();
		}

		const interval = setInterval(() => {
			setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
		}, 1000);

		return () => clearInterval(interval);
	}, [timeLeft, onWarn, onTimeUp]);

	// Heartbeat to server every 30s + on unmount
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

		// heartbeat every 30s
		const heartbeatInterval = setInterval(() => {
			if (timeLeft > 0) sendHeartbeat(timeLeft);
		}, 30_000);

		// send on unmount/logout
		return () => {
			clearInterval(heartbeatInterval);
			if (timeLeft > 0) sendHeartbeat(timeLeft);
		};
	}, [timeLeft, userId, quizId]);

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

import React, { useEffect, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";

type TimerProps = {
	userId: string;
	quizId: string;
	onTimeUp: () => void;
};

const Timer: React.FC<TimerProps> = ({ userId, quizId, onTimeUp }) => {
	const [timeLeft, setTimeLeft] = useState<number | null>(null);

	useEffect(() => {
		const initTimer = async () => {
			try {
				// fetch server time + quiz end time
				const [serverRes, endTimeRes] = await Promise.all([
					fetch("/api/server-time"),
					fetch(`/api/quiz-end-time?userId=${userId}&quizId=${quizId}`),
				]);

				const serverData = await serverRes.json();
				const endTimeData = await endTimeRes.json();

				if (!endTimeData.endTime) {
					console.error("No endTime returned from server");
					return;
				}

				const remainingSeconds = Math.floor(
					(endTimeData.endTime - serverData.serverTime) / 1000
				);

				setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);
			} catch (error) {
				console.error("Failed to init timer", error);
			}
		};

		initTimer();
	}, [userId, quizId]);

	useEffect(() => {
		if (timeLeft === null) return;
		if (timeLeft <= 0) {
			onTimeUp?.();
			return;
		}

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev === null) return null;
				if (prev <= 1) {
					clearInterval(interval);
					onTimeUp?.();
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
			<TimerIcon size={36} className="text-accent" />
			<div className="flex flex-col text-sm">
				<span>Time</span>
				<span>Left:</span>
			</div>
			<div className="w-[150px] flex items-center justify-center p-2 text-sm gap-2 bg-neutral-100 border border-neutral-300 rounded-md">
				<div className="flex flex-col items-center">
					<span className="text-xl">{hrs.toString().padStart(2, "0")}</span>
					<span className="text-[10px] font-light">hrs</span>
				</div>
				<div>:</div>
				<div className="flex flex-col items-center">
					<span className="text-xl">{mins.toString().padStart(2, "0")}</span>
					<span className="text-[10px] font-light">min</span>
				</div>
				<div>:</div>
				<div className="flex flex-col items-center">
					<span className="text-xl">{secs.toString().padStart(2, "0")}</span>
					<span className="text-[10px] font-light">sec</span>
				</div>
			</div>
		</div>
	);
};

export default Timer;

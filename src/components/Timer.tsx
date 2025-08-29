import React, { useEffect, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";

interface TimerProps {
	duration: number; // in minutes
	onTimeUp?: () => void;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp }) => {
	const STORAGE_KEY = "quiz_end_time";

	const getInitialTime = () => {
		const storedEndTime = localStorage.getItem(STORAGE_KEY);
		const now = Date.now();

		if (storedEndTime) {
			const endTime = parseInt(storedEndTime, 10);

			// If value is not a number or is in the past → reset
			if (isNaN(endTime) || endTime <= now) {
				const newEndTime = now + duration * 60 * 1000;
				localStorage.setItem(STORAGE_KEY, newEndTime.toString());
				return duration * 60;
			}

			// valid endTime
			const diff = Math.floor((endTime - now) / 1000);
			return diff > 0 ? diff : 0;
		} else {
			// first time
			const endTime = now + duration * 60 * 1000;
			localStorage.setItem(STORAGE_KEY, endTime.toString());
			return duration * 60;
		}
	};

	const [timeLeft, setTimeLeft] = useState(getInitialTime);

	useEffect(() => {
		if (timeLeft <= 0) {
			if (onTimeUp) onTimeUp();
			return;
		}

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
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

	const hrs = Math.floor(timeLeft / 3600);
	const mins = Math.floor((timeLeft % 3600) / 60);
	const secs = timeLeft % 60;

	return (
		<div className="text-2xl font-bold flex items-center justify-center gap-3">
			<TimerIcon
				size={36}
				className="text-accent transition-transform duration-200 hover:scale-110"
			/>
			<div className="flex flex-col text-sm">
				<span>Time</span>
				<span>Left:</span>
			</div>
			<div className="w-[150px] flex items-center justify-center p-2 text-sm gap-2 bg-neutral-100 border border-neutral-300 rounded-md">
				<div className="flex flex-col items-center justify-center">
					<span className="text-xl leading-4">
						{hrs.toString().padStart(2, "0")}
					</span>
					<span className="text-[10px] font-light">hrs</span>
				</div>
				<div>:</div>
				<div className="flex flex-col items-center justify-center">
					<span className="text-xl leading-4">
						{mins.toString().padStart(2, "0")}
					</span>
					<span className="text-[10px] font-light">min</span>
				</div>
				<div>:</div>
				<div className="flex flex-col items-center justify-center">
					<span className="text-xl leading-4">
						{secs.toString().padStart(2, "0")}
					</span>
					<span className="text-[10px] font-light">sec</span>
				</div>
			</div>
		</div>
	);
};

export default Timer;

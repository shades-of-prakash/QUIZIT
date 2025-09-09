import React, { useState } from "react";
import { Navigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import {
	Timer,
	CircleQuestionMark,
	Calendar,
	CalendarClock,
	ChevronUp,
	ChevronDown,
} from "lucide-react";

const Instructions: React.FC = () => {
	const { user, isLoading } = useUserAuth();

	const [openIndex, setOpenIndex] = useState<number | null>(0);
	const [isStarting, setIsStarting] = useState(false);
	const [redirectToQuiz, setRedirectToQuiz] = useState(false);

	const toggleDropdown = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	const startQuiz = async () => {
		if (!user) return;

		setIsStarting(true);

		try {
			const { _id: userId, quizId, quizDuration } = user;

			const res = await fetch("/api/create-quiz-session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, quizId, quizDuration }),
			});

			if (!res.ok) {
				console.error("Failed to create quiz session");
				setIsStarting(false);
				return;
			}

			setRedirectToQuiz(true);
		} catch (err) {
			console.error("Error creating quiz session:", err);
			setIsStarting(false);
		} finally {
			setIsStarting(false);
		}
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (redirectToQuiz) {
		return <Navigate to="/quiz" replace />;
	}

	const guidelines = [
		[
			"This quiz consists of multiple-choice questions (MCQs) and must be attempted individually by each registered participant.",
			"The total duration will be announced beforehand. The timer starts once you begin and cannot be paused.",
			"The quiz must be attempted in full-screen mode. Exiting full-screen will lead to auto-submission of the quiz.",
			"No internet browsing, search engines, or external study materials are permitted during the quiz.",
			"No tab switching or opening of other applications/software is allowed. Any such attempt will result in auto-submission or disqualification.",
		],
		[
			"Answers are saved automatically but ensure you click 'Submit' before moving to the next question.",
			"Each question can only be attempted once – no reattempts are allowed.",
		],
		[
			"The quiz is monitored/proctored.",
			"Any malpractice or impersonation will result in immediate disqualification.",
			"The decision of the organizers will be final and binding.",
		],
	];

	return (
		<div className="w-screen h-dvh flex p-8">
			<div className="flex w-full h-full border border-neutral-300 rounded-md overflow-hidden">
				{/* Left side */}
				<div className="flex flex-col w-1/2 h-full p-4 gap-4 bg-neutral-100">
					<div className="flex text-xl">
						<p className="font-bold">QUIZ</p>
						<span className="font-bold text-accent">IT</span>
					</div>

					<div className="mt-5">
						<div className="flex items-center gap-2">
							<div className="w-14 h-14 bg-red-900 rounded-md"></div>
							<div className="flex flex-col leading-5">
								<span className="font-bold text-xl">IDCC</span>
								<span className="text-base">Information Technology</span>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-1 my-5">
						<span className="mb-3 font-semibold ">Quiz info</span>
						<div className="flex flex-col gap-3">
							<div className="w-full flex">
								<div className="w-1/2  flex  items-center gap-1">
									<Timer size={18} />
									<span>Duration</span>
								</div>
								<span className="w-1/2">1 Hour 30 Minutes</span>
							</div>
							<div className="flex w-full">
								<div className="flex items-center w-1/2 gap-1">
									<CircleQuestionMark size={18} />
									<span>Questions</span>
								</div>
								<span className="w-1/2">22</span>
							</div>
							<div className="w-full flex ">
								<div className="flex items-center w-1/2 gap-1">
									<Calendar size={18} />
									<span>Start Date</span>
								</div>
								<span className="w-1/2">06 Aug 25, 12:00 PM IST</span>
							</div>
							<div className="w-full flex  ">
								<div className="w-1/2 items-center flex gap-1">
									<CalendarClock size={18} />
									<span>End Date</span>
								</div>
								<span className="w-1/2">06 Aug 25, 10:00 PM IST</span>
							</div>
						</div>
					</div>
					<span className="font-bold text-xl">Hello ,</span>
					<div className="flex flex-col gap-3 text-sm text-neutral-500">
						<span>
							We are delighted to welcome you to this quiz process. This quiz is
							designed to test the necessary skills and knowledge that would
							help us make an informed decision regarding your application
							further.
						</span>

						<span>
							Before you start the quiz, kindly go through all the instructions
							and guidelines carefully. If you encounter any technical issues or
							have questions, please contact our support team.
						</span>

						<span>
							We appreciate your time and effort in completing this quiz. Good
							Luck!
						</span>
					</div>
				</div>

				{/* Right side */}
				<div className="w-1/2 p-3 h-full flex flex-col justify-between">
					<div className="w-full ">
						<div className="w-full flex flex-col gap-3">
							<span className="text-xl font-semibold">Guidelines</span>

							{guidelines.map((items, index) => (
								<div
									key={index}
									className="bg-neutral-100 border border-neutral-300 rounded-md"
								>
									<button
										onClick={() => toggleDropdown(index)}
										className="w-full text-left px-4 py-2 font-medium flex justify-between items-center"
									>
										<span>Key Guidelines {index + 1}</span>
										<span>
											{openIndex === index ? (
												<ChevronUp size={18} />
											) : (
												<ChevronDown size={18} />
											)}
										</span>
									</button>

									{openIndex === index && (
										<ul className=" flex flex-col p-2 bg-white gap-2 text-sm">
											{items.map((point, i) => (
												<li key={i}>
													<div className="flex  gap-2">
														<span>&bull; </span>
														<span>{point}</span>
													</div>
												</li>
											))}
										</ul>
									)}
								</div>
							))}
						</div>
					</div>
					<div className="w-full flex justify-end items-center">
						<button
							onClick={startQuiz}
							disabled={isStarting}
							className={`py-2 px-4 transition rounded-md text-white ${
								isStarting
									? "bg-gray-400 cursor-not-allowed"
									: "bg-accent hover:bg-accent-light"
							}`}
						>
							{isStarting ? "Starting Quiz..." : "Continue"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Instructions;

import React, { useState, useEffect, useCallback } from "react";
import Slider from "./Slider";
import Timer from "./Timer";
import parse from "html-react-parser";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import { useUserAuth } from "../context/userAuthContext";
import { useNavigate } from "react-router";
import { toast } from "sonner";

/* ---------------- MODAL COMPONENT ---------------- */
const WarningModal: React.FC<{
	open: boolean;
	message: string;
	onClose: () => void;
}> = ({ open, message, onClose }) => {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
			<div className="bg-white rounded-xl shadow-lg w-[400px] p-6 text-center">
				<h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Warning</h2>
				<p className="mb-6 text-gray-800">{message}</p>
				<button
					onClick={onClose}
					className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
				>
					I Understand
				</button>
			</div>
		</div>
	);
};

type Question = {
	sno: string;
	question: string;
	options: string[];
	multiple: boolean;
};

const Quiz: React.FC = () => {
	const { user } = useUserAuth();
	const navigate = useNavigate();
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const [questions, setQuestions] = useState<Question[]>([]);
	const [activeQuestion, setActiveQuestion] = useState(0);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<number, number[]>
	>({});
	const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
		new Set()
	);

	const [tabSwitchCount, setTabSwitchCount] = useState(0);
	const [showWarning, setShowWarning] = useState(false);
	const [warningMessage, setWarningMessage] = useState("");

	const STORAGE_KEY = `quiz_answers_${user?.quizId || "default"}`;
	const ACTIVE_KEY = `quiz_active_${user?.quizId || "default"}`;
	const SKIPPED_KEY = `quiz_skipped_${user?.quizId || "default"}`;

	/* ---------------- TIMER ---------------- */
	const handleTimeUp = () => {
		toast.warning("⏰ Time is up! Auto-submitting your answers.");
		handleSubmit();
	};

	/* ---------------- SUBMIT ---------------- */
	const handleSubmit = async () => {
		if (submitting || submitted) return;

		if (!user || !user.quizId) {
			toast.error("❌ User or quiz not found!");
			return;
		}

		setSubmitting(true);

		const payload = {
			participant1: user.participant1,
			participant2: user.participant2,
			email: user.email,
			userId: user._id,
			quizId: user.quizId,
			answers: selectedOptions,
		};

		try {
			const res = await fetch("/api/submit-quiz", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				credentials: "include",
			});

			if (!res.ok) throw new Error("Failed to submit quiz");
			await res.json();

			localStorage.removeItem(STORAGE_KEY);
			localStorage.removeItem(ACTIVE_KEY);
			localStorage.removeItem(SKIPPED_KEY);

			setSubmitted(true);
			toast.success("✅ Quiz submitted successfully!");
			navigate("/test");
		} catch (err) {
			console.error("❌ Error submitting quiz:", err);
			toast.error("Failed to submit quiz. Please try again.");
			setSubmitting(false);
		}
	};

	/* ---------------- RESTORE STATE ---------------- */
	useEffect(() => {
		try {
			const savedAnswers = localStorage.getItem(STORAGE_KEY);
			if (savedAnswers) setSelectedOptions(JSON.parse(savedAnswers));

			const savedActive = localStorage.getItem(ACTIVE_KEY);
			if (savedActive) setActiveQuestion(Number(savedActive));

			const savedSkipped = localStorage.getItem(SKIPPED_KEY);
			if (savedSkipped) setSkippedQuestions(new Set(JSON.parse(savedSkipped)));
		} catch (e) {
			console.error("❌ Failed to restore quiz state", e);
			toast.error("Failed to restore quiz state");
		}
	}, [STORAGE_KEY, ACTIVE_KEY, SKIPPED_KEY]);

	/* ---------------- PERSIST STATE ---------------- */
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedOptions));
	}, [selectedOptions]);

	useEffect(() => {
		localStorage.setItem(ACTIVE_KEY, String(activeQuestion));
	}, [activeQuestion]);

	useEffect(() => {
		localStorage.setItem(SKIPPED_KEY, JSON.stringify([...skippedQuestions]));
	}, [skippedQuestions]);

	/* ---------------- FETCH QUIZ ---------------- */
	useEffect(() => {
		const fetchQuiz = async (quizId: string) => {
			try {
				const response = await fetch("/api/quizdetails", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ quizId }),
				});
				if (!response.ok) throw new Error("Failed to fetch quiz");
				return response.json();
			} catch (err) {
				console.error("❌ Error fetching quiz:", err);
				toast.error("Failed to load quiz. Please refresh.");
				return null;
			}
		};

		if (user?.quizId) {
			fetchQuiz(user.quizId).then((data) => {
				if (data?.questions) setQuestions(data.questions);
			});
		}
	}, [user]);

	/* ---------------- PRISM HIGHLIGHT ---------------- */
	useEffect(() => {
		if (questions.length > 0) Prism.highlightAll();
	}, [activeQuestion, questions]);

	/* ---------------- FULLSCREEN ---------------- */
	useEffect(() => {
		const docEl: any = document.documentElement;
		if (docEl.requestFullscreen) docEl.requestFullscreen();
	}, []);

	/* ---------------- TAB SWITCH DETECTION ---------------- */
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				setTabSwitchCount((prev) => {
					const newCount = prev + 1;

					if (newCount === 1 || newCount === 2) {
						setWarningMessage(
							`⚠️ Warning ${newCount}/3: Do not switch tabs. On 3rd attempt, quiz will be auto-submitted.`
						);
						setShowWarning(true);
					}

					if (newCount > 2) {
						toast.error("🚨 You switched tabs 3 times. Auto-submitting quiz.");
						handleSubmit();
					}

					return newCount;
				});
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	/* ---------------- OPTION SELECT ---------------- */
	const handleOptionChange = useCallback(
		(optionIndex: number) => {
			setSelectedOptions((prev) => {
				const isMultiple = questions[activeQuestion]?.multiple ?? false;
				const prevOptions = prev[activeQuestion] || [];

				let updated: number[];
				if (isMultiple) {
					updated = prevOptions.includes(optionIndex)
						? prevOptions.filter((i) => i !== optionIndex)
						: [...prevOptions, optionIndex];
				} else {
					updated = [optionIndex];
				}

				const newSelected = { ...prev, [activeQuestion]: updated };

				setSkippedQuestions((prevSkipped) => {
					const newSkipped = new Set(prevSkipped);
					if (updated.length > 0) newSkipped.delete(activeQuestion);
					return newSkipped;
				});

				return newSelected;
			});
		},
		[activeQuestion, questions]
	);

	/* ---------------- SKIP TRACKING ---------------- */
	const markSkippedIfNeeded = useCallback(
		(index: number) => {
			if (!selectedOptions[index]?.length) {
				setSkippedQuestions((prev) => new Set(prev).add(index));
			} else {
				setSkippedQuestions((prev) => {
					const newSkipped = new Set(prev);
					newSkipped.delete(index);
					return newSkipped;
				});
			}
		},
		[selectedOptions]
	);

	/* ---------------- NAVIGATION ---------------- */
	const handleNext = () => {
		markSkippedIfNeeded(activeQuestion);
		if (activeQuestion < questions.length - 1)
			setActiveQuestion(activeQuestion + 1);
	};
	const handlePrevious = () => {
		markSkippedIfNeeded(activeQuestion);
		if (activeQuestion > 0) setActiveQuestion(activeQuestion - 1);
	};
	const handleSetActive = (i: number) => {
		markSkippedIfNeeded(activeQuestion);
		setActiveQuestion(i);
	};

	/* ---------------- RENDER ---------------- */
	if (questions.length === 0) {
		return (
			<div className="flex items-center justify-center h-screen">
				Loading quiz...
			</div>
		);
	}

	return (
		<>
			{/* MODAL */}
			<WarningModal
				open={showWarning}
				message={warningMessage}
				onClose={() => setShowWarning(false)}
			/>

			<div className="w-screen h-dvh flex flex-col gap-2 overflow-hidden">
				{/* HEADER */}
				<div className="w-full bg-white flex justify-between items-center px-4 py-3">
					<div className="flex gap-2 items-center">
						<h1 className="text-2xl font-bold">
							QUIZ<span className="text-accent">IT</span>
						</h1>
						<div className="text-[10px] p-1 font-semibold bg-neutral-200 rounded-md">
							RVR&JC
						</div>
					</div>
					<div className="ml-32">
						<Slider
							total={questions.length}
							active={activeQuestion}
							setActive={handleSetActive}
							selectedOptions={selectedOptions}
							skippedQuestions={skippedQuestions}
						/>
					</div>
					<div className="h-15 flex-shrink-0 flex items-center gap-4">
						<Timer
							userId={user?._id ?? ""}
							quizId={user?.quizId ?? ""}
							onTimeUp={handleTimeUp}
						/>
						<button
							onClick={handleSubmit}
							disabled={submitting || submitted}
							className={`px-5 py-2 rounded-md text-white ${
								submitted
									? "bg-gray-500 cursor-not-allowed"
									: submitting
									? "bg-red-400 cursor-wait"
									: "bg-red-800 hover:bg-red-900"
							}`}
						>
							{submitted
								? "Submitted"
								: submitting
								? "Submitting..."
								: "Submit"}
						</button>
					</div>
				</div>

				{/* MAIN QUIZ */}
				<div className="w-full flex flex-1 px-4">
					<div className="flex w-full h-[600px] border border-neutral-800/20 rounded-md overflow-hidden">
						{/* QUESTION */}
						<div className="w-1/2 bg-neutral-50 p-10 flex flex-col gap-4">
							<span className="font-semibold">
								Question {activeQuestion + 1}
							</span>
							<div className="font-semibold overflow-hidden">
								{parse(questions[activeQuestion]?.question ?? "")}
							</div>
						</div>

						{/* OPTIONS */}
						<div className="w-1/2 flex flex-col p-10 gap-3">
							<span className="font-semibold">Answer</span>
							<div className="flex flex-col gap-6">
								{questions[activeQuestion]?.options.map((opt, i) => {
									const isChecked =
										selectedOptions[activeQuestion]?.includes(i) || false;
									const isMultiple =
										questions[activeQuestion]?.multiple ?? false;
									const id = `quiz-${activeQuestion}-${i}`;

									return (
										<div
											key={i}
											className={`hover:bg-neutral-100 flex gap-2 items-center border border-neutral-800/30 rounded-md px-4 py-3 cursor-pointer ${
												isChecked ? "!border-black" : ""
											}`}
											onClick={() => handleOptionChange(i)}
										>
											<input
												type={isMultiple ? "checkbox" : "radio"}
												id={id}
												name={`quiz-${activeQuestion}`}
												className="w-5 h-5 accent-black rounded focus:ring-0 focus:border-black"
												checked={isChecked}
												onChange={() => handleOptionChange(i)}
												onClick={(e) => e.stopPropagation()}
											/>
											<label
												htmlFor={id}
												className="text-neutral-800 select-none cursor-pointer"
											>
												{opt}
											</label>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				{/* FOOTER NAV */}
				{/* <div className="w-full flex justify-end mb-10 gap-3 px-4 py-2">
					<button
						onClick={handlePrevious}
						disabled={activeQuestion === 0}
						className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
					>
						Previous
					</button>
					<button
						onClick={handleNext}
						disabled={activeQuestion === questions.length - 1}
						className="bg-accent px-4 py-2 rounded-md disabled:opacity-50"
					>
						Next
					</button>
				</div> */}
				{/* FOOTER NAV */}
				<div className="w-full flex justify-end mb-10 gap-3 px-4 py-2">
					{/* <div> */}
					<button
						onClick={handlePrevious}
						disabled={activeQuestion === 0}
						className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50"
					>
						Previous
					</button>
					<button
						onClick={handleNext}
						disabled={activeQuestion === questions.length - 1}
						className="bg-accent px-4 py-2 rounded-md disabled:opacity-50"
					>
						Next
					</button>
					{/* </div> */}
				</div>
			</div>
		</>
	);
};

export default Quiz;

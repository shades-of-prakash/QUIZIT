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
import { TriangleAlert } from "lucide-react";

type Question = {
	sno?: string;
	question?: string;
	options?: string[];
	multiple?: boolean;
	user_options?: number[];
};

const WarningModal: React.FC<{
	open: boolean;
	message: string;
	onClose: () => void;
}> = ({ open, message, onClose }) => {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
			<div className="bg-white rounded-xl shadow-xl w-[380px] p-6 text-center animate-fadeIn">
				<div className="flex flex-col items-center justify-center gap-2 mb-4">
					<TriangleAlert size={48} />
					<h2 className="text-2xl font-semibold text-amber-700">Warning</h2>
				</div>
				<p className="flex flex-col gap-1 mb-6 text-sm text-gray-700 leading-relaxed p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<span>
						You have switched tabs
						<span className="font-semibold mx-1">{message} out of 3</span>{" "}
						times.
					</span>
					<span>If it happens again, your quiz will be</span>
					<span className="font-semibold text-red-600">auto-submitted</span>
				</p>
				<button
					onClick={onClose}
					className="w-full px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-md transition-colors"
				>
					I Understand
				</button>
			</div>
		</div>
	);
};

const Quiz: React.FC = () => {
	const { user } = useUserAuth();
	const navigate = useNavigate();

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [sessionLoaded, setSessionLoaded] = useState(false);

	const [questions, setQuestions] = useState<Question[]>([]);
	const [activeQuestion, setActiveQuestion] = useState(0);
	const [remainingSeconds, setRemainingSeconds] = useState(0);
	const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
		new Set()
	);

	const [tabSwitchCount, setTabSwitchCount] = useState(0);
	const [showWarning, setShowWarning] = useState(false);
	const [warningMessage, setWarningMessage] = useState("");

	/* ---------------- INITIALIZE SESSION ---------------- */
	const initializeSession = async () => {
		if (!user || !user.quizId) return;

		try {
			const res = await fetch("/api/create-quiz-session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user._id,
					quizId: user.quizId,
					quizDuration: user.quizDuration || 60, // Default 60 minutes
				}),
				credentials: "include",
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to initialize session");
			}

			const data = await res.json();

			setQuestions(data.questions || []);
			setRemainingSeconds(data.remainingSeconds || 0);
			setActiveQuestion(data.activeQuestion || 0);
			setSkippedQuestions(new Set(data.skippedQuestions || []));

			setSessionLoaded(true);
		} catch (error: any) {
			console.error("Failed to initialize session:", error);
			toast.error(error.message || "Failed to load quiz session");
			navigate("/");
		}
	};

	/* ---------------- SAVE SESSION STATE ---------------- */
	const saveSessionState = async (updatedQuestions?: Question[]) => {
		if (!user || !user.quizId || !sessionLoaded) return;

		const questionsToSave = updatedQuestions || questions;

		try {
			await fetch("/api/save-session-state", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user._id,
					quizId: user.quizId,
					questions: questionsToSave,
					activeQuestion,
					skippedQuestions: Array.from(skippedQuestions),
				}),
				credentials: "include",
			});
		} catch (error) {
			console.error("Failed to save session state:", error);
			toast.error("Failed to save progress");
		}
	};

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

		const unanswered = questions.filter(
			(q) => !q.user_options || q.user_options.length === 0
		);
		if (unanswered.length > 0) {
			toast.warning(
				`You must answer all questions before submitting. ${unanswered.length} question(s) left unanswered.`
			);
			return;
		}

		setSubmitting(true);

		try {
			const res = await fetch("/api/submit-quiz", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user._id,
					quizId: user.quizId,
					participant1Name: user.participant1Name,
					participant1RollNo: user.participant1RollNo,
					participant2Name: user.participant2Name,
					participant2RollNo: user.participant2RollNo,
					email: user.email,
					questions,
				}),
				credentials: "include",
			});

			if (!res.ok) throw new Error("Failed to submit quiz");

			await res.json();
			setSubmitted(true);
			toast.success("✅ Quiz submitted successfully!");
			navigate("/submission");
		} catch (error) {
			console.error("Submit error:", error);
			toast.error("Failed to submit quiz. Please try again.");
			setSubmitting(false);
		}
	};

	useEffect(() => {
		if (user?._id && user.quizId) {
			initializeSession();
		}
	}, [user]);

	/* ---------------- PRISM HIGHLIGHTING ---------------- */
	useEffect(() => {
		if (questions.length > 0) {
			setTimeout(() => Prism.highlightAll(), 100);
		}
	}, [activeQuestion, questions]);

	/* ---------------- TAB SWITCH DETECTION ---------------- */
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden && sessionLoaded && !submitted) {
				setTabSwitchCount((prev) => {
					const newCount = prev + 1;
					if (newCount < 3) {
						setWarningMessage(`${newCount}`);
						setShowWarning(true);
					} else {
						toast.error("🚨 You switched tabs 3 times. Auto-submitting quiz.");
						handleSubmit();
					}
					return newCount;
				});
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, [sessionLoaded, submitted]);

	/* ---------------- OPTION SELECT ---------------- */
	const handleOptionChange = useCallback(
		(optionIndex: number) => {
			setQuestions((prevQuestions) => {
				const updatedQuestions = [...prevQuestions];
				const currentQuestion = { ...updatedQuestions[activeQuestion] };
				const isMultiple = currentQuestion.multiple;
				const currentOptions = [...(currentQuestion.user_options || [])];

				if (isMultiple) {
					if (currentOptions.includes(optionIndex)) {
						currentQuestion.user_options = currentOptions.filter(
							(i) => i !== optionIndex
						);
					} else {
						currentQuestion.user_options = [...currentOptions, optionIndex];
					}
				} else {
					currentQuestion.user_options = [optionIndex];
				}

				updatedQuestions[activeQuestion] = currentQuestion;
				saveSessionState(updatedQuestions);
				return updatedQuestions;
			});
		},
		[activeQuestion, saveSessionState]
	);

	/* ---------------- NAVIGATION ---------------- */
	const handleNext = () => {
		if (activeQuestion < questions.length - 1) {
			setActiveQuestion(activeQuestion + 1);
		}
	};

	const handlePrevious = () => {
		if (activeQuestion > 0) {
			setActiveQuestion(activeQuestion - 1);
		}
	};

	const handleSetActive = (i: number) => {
		setActiveQuestion(i);
	};

	/* ---------------- SKIPPED TRACKING ---------------- */
	useEffect(() => {
		if (!sessionLoaded) return;

		setSkippedQuestions(() => {
			const newSkipped = new Set<number>();
			questions.forEach((q, idx) => {
				if (!q.user_options || q.user_options.length === 0) {
					newSkipped.add(idx);
				}
			});
			return newSkipped;
		});

		saveSessionState();
	}, [activeQuestion, questions, sessionLoaded]);

	/* ---------------- LOADING STATE ---------------- */
	if (!sessionLoaded || questions.length === 0) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
					<p>Loading quiz...</p>
				</div>
			</div>
		);
	}

	const selectedOptions: Record<number, number[]> = {};
	questions.forEach((q, index) => {
		selectedOptions[index] = q.user_options || [];
	});

	return (
		<>
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
							onWarn={() => {
								toast.warning("⚠️ Only 20 seconds left! Hurry up.");
							}}
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
							<div className="font-semibold overflow-auto">
								{parse(questions[activeQuestion]?.question ?? "")}
							</div>
						</div>

						{/* OPTIONS */}
						<div className="w-1/2 flex flex-col p-10 gap-3">
							<span className="font-semibold">Answer</span>
							<div className="flex flex-col gap-6 overflow-auto">
								{questions[activeQuestion]?.options?.map((opt, i) => {
									const isChecked =
										questions[activeQuestion]?.user_options?.includes(i) ||
										false;
									const isMultiple =
										questions[activeQuestion]?.multiple ?? false;
									const id = `quiz-${activeQuestion}-${i}`;

									return (
										<div
											key={i}
											className={`hover:bg-neutral-100 flex gap-2 items-center border border-neutral-800/30 rounded-md px-4 py-3 cursor-pointer transition-colors ${
												isChecked ? "!border-black bg-neutral-100" : ""
											}`}
											onClick={() => handleOptionChange(i)}
										>
											<input
												type={isMultiple ? "checkbox" : "radio"}
												id={id}
												name={
													!isMultiple ? `quiz-${activeQuestion}` : undefined
												}
												className="w-5 h-5 accent-black rounded focus:ring-0 focus:border-black"
												checked={isChecked}
												onChange={() => handleOptionChange(i)}
											/>

											<label
												htmlFor={id}
												className="text-neutral-800 select-none cursor-pointer flex-1"
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
				<div className="w-full flex justify-end mb-10 gap-3 px-4 py-2">
					<button
						onClick={handlePrevious}
						disabled={activeQuestion === 0}
						className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
					>
						Previous
					</button>
					<button
						onClick={handleNext}
						disabled={activeQuestion === questions.length - 1}
						className="bg-accent px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
					>
						Next
					</button>
				</div>
			</div>
		</>
	);
};

export default Quiz;

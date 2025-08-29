import React, { useState, useEffect } from "react";
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

type Question = {
	sno: string;
	question: string;
	options: string[];
	multiple: boolean;
};

const Quiz: React.FC = () => {
	const { user } = useUserAuth();

	const [questions, setQuestions] = useState<Question[]>([]);
	const [activeQuestion, setActiveQuestion] = useState<number>(0);
	const [selectedOptions, setSelectedOptions] = useState<{
		[key: number]: string[];
	}>({});
	const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
		new Set()
	);

	const handleTimeUp = () => {
		console.log("⏰ Time’s up! Auto-submitting...");
		alert("Time is up! Your answers are being submitted.");
	};

	const STORAGE_KEY = `quiz_answers_${user?.quizId || "default"}`;
	const ACTIVE_KEY = `quiz_active_${user?.quizId || "default"}`;
	const SKIPPED_KEY = `quiz_skipped_${user?.quizId || "default"}`;

	useEffect(() => {
		const savedAnswers = localStorage.getItem(STORAGE_KEY);
		if (savedAnswers) {
			try {
				setSelectedOptions(JSON.parse(savedAnswers));
			} catch (e) {
				console.error("Failed to parse saved answers", e);
			}
		}

		const savedActive = localStorage.getItem(ACTIVE_KEY);
		if (savedActive) {
			setActiveQuestion(Number(savedActive));
		}

		const savedSkipped = localStorage.getItem(SKIPPED_KEY);
		if (savedSkipped) {
			try {
				setSkippedQuestions(new Set(JSON.parse(savedSkipped)));
			} catch (e) {
				console.error("Failed to parse skipped questions", e);
			}
		}
	}, [STORAGE_KEY, ACTIVE_KEY, SKIPPED_KEY]);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedOptions));
	}, [selectedOptions, STORAGE_KEY]);

	useEffect(() => {
		localStorage.setItem(ACTIVE_KEY, String(activeQuestion));
	}, [activeQuestion, ACTIVE_KEY]);

	useEffect(() => {
		localStorage.setItem(SKIPPED_KEY, JSON.stringify([...skippedQuestions]));
	}, [skippedQuestions, SKIPPED_KEY]);

	useEffect(() => {
		const getQuizData = async (quizId: string) => {
			const response = await fetch("/api/quizdetails", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quizId }),
			});

			if (!response.ok) {
				console.error("Failed to fetch quiz");
				return null;
			}

			const data = await response.json();
			return data;
		};

		if (user && user.quizId) {
			(async () => {
				const data = await getQuizData(user.quizId);
				if (data?.questions) {
					setQuestions(data.questions);
				}
			})();
		}
	}, [user]);

	useEffect(() => {
		Prism.highlightAll();
	}, [activeQuestion, questions]);

	const handleOptionChange = (option: string) => {
		setSelectedOptions((prev) => {
			const isMultiple = questions[activeQuestion]?.multiple ?? false;
			const prevOptions = prev[activeQuestion] || [];

			let updatedOptions: string[];
			if (isMultiple) {
				updatedOptions = prevOptions.includes(option)
					? prevOptions.filter((o) => o !== option)
					: [...prevOptions, option];
			} else {
				updatedOptions = [option];
			}

			const newSelected = { ...prev, [activeQuestion]: updatedOptions };

			setSkippedQuestions((prevSkipped) => {
				const newSkipped = new Set(prevSkipped);
				if (updatedOptions.length > 0) {
					newSkipped.delete(activeQuestion);
				}
				return newSkipped;
			});

			return newSelected;
		});
	};

	const markSkippedIfNeeded = (currentIndex: number) => {
		if (!selectedOptions[currentIndex]?.length) {
			setSkippedQuestions((prev) => new Set(prev).add(currentIndex));
		} else {
			setSkippedQuestions((prev) => {
				const newSkipped = new Set(prev);
				newSkipped.delete(currentIndex);
				return newSkipped;
			});
		}
	};

	const handleNext = () => {
		markSkippedIfNeeded(activeQuestion);
		if (activeQuestion < questions.length - 1) {
			setActiveQuestion(activeQuestion + 1);
		}
	};

	const handlePrevious = () => {
		markSkippedIfNeeded(activeQuestion);
		if (activeQuestion > 0) {
			setActiveQuestion(activeQuestion - 1);
		}
	};

	const handleSetActive = (index: number) => {
		markSkippedIfNeeded(activeQuestion);
		setActiveQuestion(index);
	};

	if (questions.length === 0) {
		return (
			<div className="flex items-center justify-center h-screen">
				Loading quiz...
			</div>
		);
	}

	return (
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
				<div className="h-15  flex-shrink-0 flex items-center justify-between gap-4">
					<div className="text-2xl font-bold flex items-center justify-center gap-3">
						<Timer
							duration={Number(user?.quizDuration ?? 0)}
							onTimeUp={handleTimeUp}
						/>
					</div>
					<button className="px-5 py-2 bg-red-800 text-white rounded-md">
						Submit
					</button>
				</div>
			</div>

			{/* MAIN QUIZ */}
			<div className="w-full flex flex-1 px-4">
				<div className="flex w-full h-[600px] border border-neutral-800/20 rounded-md overflow-hidden">
					{/* QUESTION */}
					<div className="w-1/2 h-full bg-neutral-50 p-10 flex flex-col gap-4">
						<span className="font-semibold">Question {activeQuestion + 1}</span>
						<div className="w-full font-semibold overflow-hidden">
							{parse(questions[activeQuestion]?.question ?? "")}
						</div>
					</div>

					{/* OPTIONS */}
					<div className="w-1/2 flex flex-col h-full p-10 gap-3">
						<span className="font-semibold">Answer</span>
						<div className="flex flex-col gap-6">
							{questions[activeQuestion]?.options?.map((option, index) => {
								const id = `quiz-option-${activeQuestion}-${index}`;
								const isChecked =
									selectedOptions[activeQuestion]?.includes(option) || false;
								const isMultiple = questions[activeQuestion]?.multiple ?? false;

								return (
									<div
										key={option}
										className={`hover:bg-neutral-100 flex gap-2 items-center border border-neutral-800/30 rounded-md px-4 py-3 cursor-pointer ${
											isChecked ? "!border-black" : ""
										}`}
										onClick={() => handleOptionChange(option)}
									>
										<input
											type={isMultiple ? "checkbox" : "radio"}
											id={id}
											name={`quiz-option-${activeQuestion}`}
											className="w-5 h-5 accent-black rounded focus:ring-0 focus:border-black"
											checked={isChecked}
											onChange={() => handleOptionChange(option)}
											onClick={(e) => e.stopPropagation()}
										/>
										<label
											htmlFor={id}
											className="text-neutral-800 select-none cursor-pointer"
										>
											{option}
										</label>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* FOOTER NAV */}
			<div className="w-full flex items-center justify-end mb-10 gap-3 px-4 py-2 select-none">
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
			</div>
		</div>
	);
};

export default Quiz;

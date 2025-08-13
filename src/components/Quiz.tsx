import React, { useState, useEffect } from "react";
import Slider from "./Slider";
import { Timer } from "lucide-react";
import parse from "html-react-parser";
import Prism from "prismjs";

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";

type Question = {
	question: string;
	options: string[];
	answer: string[];
	multiple: boolean;
};

const Quiz: React.FC = () => {
	const questions: Question[] = [
		{
			question: `In JavaScript, what will be logged to the console?<br><pre><code class="language-javascript">
let count = 0;
function increment() {
    console.log(count);
    count++;
    if (count < 3) {
        setTimeout(increment, 1000);
    }
}
increment();
</code></pre>`,
			options: [
				"0, 1, 2 each after 1 second",
				"0, 1, 2 instantly",
				"0 only",
				"Error",
			],
			answer: ["0, 1, 2 each after 1 second"],
			multiple: false,
		},
		{
			question: `In SQL, which are valid ways to get top 3 customers by total amount spent?<br><pre><code class="language-sql">
-- Choose all correct answers
</code></pre>`,
			options: [
				"SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id LIMIT 3;",
				"SELECT customer_id, SUM(amount) as total FROM orders GROUP BY customer_id ORDER BY total DESC LIMIT 3;",
				"SELECT TOP 3 customer_id, SUM(amount) FROM orders GROUP BY customer_id ORDER BY SUM(amount);",
				"Both B and C are correct depending on SQL dialect",
			],
			answer: [
				"SELECT customer_id, SUM(amount) as total FROM orders GROUP BY customer_id ORDER BY total DESC LIMIT 3;",
				"SELECT TOP 3 customer_id, SUM(amount) FROM orders GROUP BY customer_id ORDER BY SUM(amount);",
				"Both B and C are correct depending on SQL dialect",
			],
			multiple: true,
		},
		// ...rest of your questions
	];

	const [activeQuestion, setActiveQuestion] = useState<number>(0);

	const [selectedOptions, setSelectedOptions] = useState<{
		[key: number]: string[];
	}>({});

	const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
		new Set()
	);

	useEffect(() => {
		Prism.highlightAll();
	}, [activeQuestion]);

	const handleOptionChange = (option: string) => {
		setSelectedOptions((prev) => {
			const isMultiple = questions[activeQuestion]?.multiple ?? false;
			const prevOptions = prev[activeQuestion] || [];

			let updatedOptions: string[];
			if (isMultiple) {
				if (prevOptions.includes(option)) {
					updatedOptions = prevOptions.filter((o) => o !== option);
				} else {
					updatedOptions = [...prevOptions, option];
				}
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

	return (
		<div className="w-screen h-dvh flex flex-col gap-2 overflow-hidden">
			{/* HEADER */}
			<div className="w-full h-14 bg-white flex justify-between items-center px-4">
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
				{/* TIMER */}
				<div className="flex gap-4">
					<div className="text-2xl font-bold flex items-center justify-center gap-3">
						<Timer size={36} className="text-accent" />
						<div className="flex flex-col text-sm">
							<span>Time</span>
							<span>Left:</span>
						</div>
						<div className="flex text-sm gap-2 bg-neutral-100 border border-neutral-300 rounded-md px-2 py-1">
							<div className="flex flex-col items-center justify-center">
								<span className="text-xl leading-4">00</span>
								<span className="text-[10px] font-light">hrs</span>
							</div>
							<div>:</div>
							<div className="flex flex-col items-center justify-center">
								<span className="text-xl leading-4">30</span>
								<span className="text-[10px] font-light">min</span>
							</div>
							<div>:</div>
							<div className="flex flex-col items-center justify-center">
								<span className="text-xl leading-4">44</span>
								<span className="text-[10px] font-light">sec</span>
							</div>
						</div>
					</div>

					<button className="bg-red-900 px-4 py-2 text-white rounded-md">
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
							{questions[activeQuestion]
								? parse(questions[activeQuestion].question)
								: null}
						</div>
					</div>

					{/* OPTIONS */}
					<div className="w-1/2 flex flex-col h-full p-10 gap-3">
						<span className="font-semibold">Answer</span>
						<div className="flex flex-col gap-6">
							{questions[activeQuestion]!.options.map((option, index) => {
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

			{/* NAVIGATION */}
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

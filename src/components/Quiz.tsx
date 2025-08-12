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

const Quiz = () => {
	const questions = [
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
			answer: "0, 1, 2 each after 1 second",
		},
		{
			question: `In Python, what will the following output and why?<br><pre><code class="language-python">
def extend_list(val, list=[]):
    list.append(val)
    return list

print(extend_list(10))
print(extend_list(123, []))
print(extend_list('a'))
</code></pre>`,
			options: [
				"[10], [123], ['a']",
				"[10], [123], [10, 'a']",
				"[10], [123], [10, 123, 'a']",
				"Error due to mutable default argument",
			],
			answer: "[10], [123], [10, 'a']",
		},
		{
			question: `In SQL, given a table <code>orders(id, customer_id, amount)</code>, which query returns the top 3 customers by total amount spent?<br><pre><code class="language-sql">
-- Choose the correct option
</code></pre>`,
			options: [
				"SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id LIMIT 3;",
				"SELECT customer_id, SUM(amount) as total FROM orders GROUP BY customer_id ORDER BY total DESC LIMIT 3;",
				"SELECT TOP 3 customer_id, SUM(amount) FROM orders GROUP BY customer_id ORDER BY SUM(amount);",
				"Both B and C are correct depending on SQL dialect",
			],
			answer: "Both B and C are correct depending on SQL dialect",
		},
		{
			question: `In Java, what is the output?<br><pre><code class="language-java">
class Test {
    public static void main(String[] args) {
        String s1 = "abc";
        String s2 = s1.concat("def");
        System.out.println(s1);
        System.out.println(s2);
    }
}
</code></pre>`,
			options: [
				`"abcdef" then "abcdef"`,
				`"abc" then "abcdef"`,
				`"abc" then "abc"`,
				"Compiler error",
			],
			answer: `"abc" then "abcdef"`,
		},
		{
			question: `In C, what is the result of this program?<br><pre><code class="language-c">
#include &lt;stdio.h&gt;
int main() {
    int x = 5;
    printf("%d %d %d", x, x++, ++x);
    return 0;
}
</code></pre>`,
			options: ["5 5 7", "5 6 7", "Undefined behavior", "Compiler error"],
			answer: "Undefined behavior",
		},
		{
			question: `In React, what is the result of this code?<br><pre><code class="language-javascript">
import React, { useState, useEffect } from 'react';

function App() {
    const [count, setCount] = useState(0);

    useEffect(() =&gt; {
        setCount(count + 1);
    }, []);

    return &lt;div&gt;{count}&lt;/div&gt;;
}
</code></pre>`,
			options: ["0", "1", "Infinite re-render", "Error"],
			answer: "1",
		},
		{
			question: `In JavaScript, what is the output?<br><pre><code class="language-javascript">
console.log([] == ![]);
console.log([] === ![]);
</code></pre>`,
			options: [
				"true then false",
				"false then false",
				"true then true",
				"false then true",
			],
			answer: "true then false",
		},
		{
			question: `In Python, what does this print?<br><pre><code class="language-python">
a = [[1, 2]] * 3
a[0][0] = 99
print(a)
</code></pre>`,
			options: [
				"[[99, 2], [1, 2], [1, 2]]",
				"[[99, 2], [99, 2], [99, 2]]",
				"[[1, 2], [1, 2], [99, 2]]",
				"Error",
			],
			answer: "[[99, 2], [99, 2], [99, 2]]",
		},
		{
			question: `In Git, what is the effect of <pre> <code>git cherry-pick &lt;commit-hash&gt;</code></pre>?<br><pre><code class="language-bash">
# Choose the correct option
</code></pre>`,
			options: [
				"Removes the commit from history",
				"Applies the changes from the specified commit to the current branch",
				"Merges two branches",
				"Resets HEAD to the commit",
			],
			answer:
				"Applies the changes from the specified commit to the current branch",
		},
		{
			question: `In JavaScript, what is the output?<br><pre><code class="language-javascript">
function test() {
    return
    {
        value: 5
    };
}
console.log(test());
</code></pre>`,
			options: ["{ value: 5 }", "undefined", "Error", "null"],
			answer: "undefined",
		},
	];

	const [activeQuestion, setActiveQuestion] = useState(0);

	const [selectedOptions, setSelectedOptions] = useState<{
		[key: number]: string;
	}>({});

	const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
		new Set()
	);

	useEffect(() => {
		Prism.highlightAll();
	}, [activeQuestion]);

	const handleCheckboxChange = (option: string) => {
		setSelectedOptions((prev) => {
			const newSelected = { ...prev, [activeQuestion]: option };

			setSkippedQuestions((prevSkipped) => {
				const newSkipped = new Set(prevSkipped);
				newSkipped.delete(activeQuestion);
				return newSkipped;
			});
			return newSelected;
		});
	};

	const markSkippedIfNeeded = (currentIndex: number) => {
		if (!selectedOptions[currentIndex]) {
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
							{parse(questions[activeQuestion]!.question)}
						</div>
					</div>

					{/* OPTIONS */}
					<div className="w-1/2 flex flex-col h-full p-10 gap-3">
						<span className="font-semibold">Answer</span>
						<div className="flex flex-col gap-6">
							{questions[activeQuestion]?.options.map((option, index) => {
								const id = `quiz-option-${index}`;
								return (
									<div
										key={option}
										className={`hover:bg-neutral-100 flex gap-2 items-center border border-neutral-800/30 rounded-md px-4 py-3 cursor-pointer ${selectedOptions[activeQuestion] === option?"!border-black":""}`}
										onClick={() => handleCheckboxChange(option)}
									>
										<input
											type="radio"
											id={id}
											name="quiz-option"
											className={`w-5 h-5 accent-black rounded focus:ring-0 focus:border-black ${selectedOptions[activeQuestion] === option?"border border-accent":""}`}
											checked={selectedOptions[activeQuestion] === option}
											onChange={() => handleCheckboxChange(option)}
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

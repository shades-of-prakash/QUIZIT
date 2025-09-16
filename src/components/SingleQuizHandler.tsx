import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { MoveLeft, Clock, ListChecks, Pencil } from "lucide-react";

interface Question {
	sno: string;
	question: string;
	options: string[];
	correct_options: string[];
	multiple: boolean;
}

interface QuizDetails {
	_id: string;
	name: string;
	duration: number;
	totalQuestions: number;
	quizQuestions: number;
	questions: Question[];
	createdAt: string;
}

const SingleQuizHandler: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [quiz, setQuiz] = useState<QuizDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const questionsPerPage = 5;

	useEffect(() => {
		const fetchQuiz = async () => {
			try {
				const res = await fetch("/api/quizdetails", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ quizId: id }),
				});

				if (!res.ok) throw new Error("Failed to fetch quiz");

				const data = await res.json();
				setQuiz(data);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchQuiz();
	}, [id]);

	if (loading) return <p>Loading...</p>;
	if (!quiz) return <p>No quiz found</p>;

	const startIndex = (page - 1) * questionsPerPage;
	const currentQuestions = quiz.questions.slice(
		startIndex,
		startIndex + questionsPerPage
	);
	const totalPages = Math.ceil(quiz.questions.length / questionsPerPage);

	const maxOptions = Math.max(...quiz.questions.map((q) => q.options.length));

	return (
		<div className="w-full flex flex-col h-full p-3 gap-4 bg-white">
			<div className="flex items-center justify-between">
				<div className="flex items-center p-2 gap-2">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center gap-2 border border-neutral-300 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
					>
						<MoveLeft size={16} />
					</button>
					<h2 className="text-xl font-semibold">{quiz.name}</h2>
				</div>

				<div className="flex gap-5 items-center text-neutral-700">
					<div className="flex items-center gap-1">
						<Clock size={18} className="text-neutral-500" />
						<span>{quiz.duration} min</span>
					</div>
					<div className="flex items-center gap-1">
						<ListChecks size={18} className="text-neutral-500" />
						<span>{quiz.totalQuestions}</span>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className="w-full h-[560px] overflow-y-scroll border border-neutral-800 rounded-lg  shadow-sm  scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-transparent">
				<table className="w-full h-full overflow-scroll rounded-md shadow-sm">
					<thead className="bg-neutral-800 text-white text-left sticky top-0">
						<tr>
							<th className="px-4 py-3 font-medium border-b border-neutral-300">
								S.No
							</th>
							<th className="px-4 py-3 font-medium border-b border-neutral-300">
								Question
							</th>
							{Array.from({ length: maxOptions }).map((_, i) => (
								<th
									key={`opt-head-${i}`}
									className="px-4 py-3 font-medium border-b border-neutral-300"
								>
									Option {i + 1}
								</th>
							))}

							<th className="px-4 py-3 font-medium border-b border-neutral-300">
								Multiple
							</th>
							<th className="px-4 py-3 font-medium border-b border-neutral-300">
								Actions
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-neutral-400">
						{currentQuestions.map((q) => (
							<tr key={q.sno} className="hover:bg-neutral-50 transition-colors">
								<td className="px-4 py-3 text-neutral-800">{q.sno}</td>
								<td className="px-4 py-3 text-neutral-800">{q.question}</td>

								{Array.from({ length: maxOptions }).map((_, i) => (
									<td
										key={`opt-${q.sno}-${i}`}
										className="px-4 py-3 text-neutral-600"
									>
										{q.options[i] || "N/A"}
									</td>
								))}

								<td className="px-4 py-3">
									<span
										className={`px-2 py-1 text-xs rounded-full ${
											q.multiple
												? "bg-green-100 text-green-700"
												: "bg-red-100 text-red-700"
										}`}
									>
										{q.multiple ? "Yes" : "No"}
									</span>
								</td>
								<td className="px-4 py-3">
									<button
										onClick={() => navigate(`/edit-question/${q.sno}`)}
										className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
									>
										<Pencil size={14} /> Edit
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="flex justify-between gap-3 items-center">
				<span className="text-neutral-800">
					Page {page} of {totalPages}
				</span>

				<div className="flex gap-2 text-neutral-800">
					<button
						disabled={page === 1}
						onClick={() => setPage((prev) => prev - 1)}
						className={`border rounded-md px-3 py-1 text-sm font-medium transition-colors
							${
								page === 1
									? "border-neutral-300 text-neutral-400 bg-neutral-100 cursor-not-allowed"
									: "border-neutral-800/40 hover:bg-black hover:text-white"
							}`}
					>
						Previous
					</button>

					<button
						disabled={page === totalPages}
						onClick={() => setPage((prev) => prev + 1)}
						className={`border rounded-md px-3 py-1 text-sm font-medium transition-colors
							${
								page === totalPages
									? "border-neutral-300 text-neutral-400 bg-neutral-100 cursor-not-allowed"
									: "border-neutral-800/40 hover:bg-black hover:text-white"
							}`}
					>
						Next
					</button>
				</div>
			</div>
		</div>
	);
};

export default SingleQuizHandler;

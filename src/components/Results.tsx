import React, { useEffect, useState } from "react";
import CustomSelect from "./CustomSelect";

interface Result {
	id: number;
	participantName: string;
	score: number;
	submittedAt: string;
}

function Results() {
	const [selectedQuiz, setSelectedQuiz] = useState<{
		value: string;
		label: string;
	} | null>(null);
	const [results, setResults] = useState<Result[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	const handleQuizSelect = (quiz: { value: string; label: string }) => {
		setSelectedQuiz(quiz);
	};

	useEffect(() => {
		if (!selectedQuiz) return;

		const fetchResults = async () => {
			setLoading(true);
			setError(false);

			try {
				const res = await fetch(`/api/results?quizId=${selectedQuiz.value}`);
				if (!res.ok) throw new Error("Failed to fetch results");

				const data = await res.json();
				console.log("data", data);

				// Map API response to table-friendly format
				const mapped = (data.results || []).map(
					(
						r: {
							participant1: string;
							participant2: string;
							score: number;
							submittedAt: number;
						},
						index: number
					) => ({
						id: index,
						participantName: `${r.participant1}, ${r.participant2}`,
						score: r.score,
						submittedAt: r.submittedAt.toString(),
					})
				);

				setResults(mapped);
			} catch (err) {
				console.error("Error fetching results:", err);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		fetchResults();
	}, [selectedQuiz]);

	return (
		<div className="p-4">
			<h2 className="text-2xl font-semibold mb-4">Quiz Results</h2>

			{/* Quiz dropdown */}
			<CustomSelect url="/api/quiznames" onChange={handleQuizSelect} />

			{/* Table */}
			{loading && <p className="mt-4 text-gray-500">Loading results...</p>}
			{error && <p className="mt-4 text-red-500">Failed to load results</p>}

			{!loading && !error && selectedQuiz && results.length > 0 && (
				<table className="mt-6 w-full border border-neutral-300 rounded-md">
					<thead className="bg-neutral-100">
						<tr>
							<th className="p-2 border">#</th>
							<th className="p-2 border">Participants</th>
							<th className="p-2 border">Score</th>
							<th className="p-2 border">Submitted At</th>
						</tr>
					</thead>
					<tbody>
						{results.map((r, index) => (
							<tr key={r.id} className="text-center">
								<td className="p-2 border">{index + 1}</td>
								<td className="p-2 border">{r.participantName}</td>
								<td className="p-2 border">{r.score}</td>
								<td className="p-2 border">
									{new Date(parseInt(r.submittedAt)).toLocaleString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{!loading && !error && selectedQuiz && results.length === 0 && (
				<p className="mt-4 text-gray-500">No results available for this quiz</p>
			)}
		</div>
	);
}

export default Results;

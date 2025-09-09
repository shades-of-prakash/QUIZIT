import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import CustomSelect from "./CustomSelect";
import { TriangleAlert, Download, ChevronUp, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";

interface QuizName {
	id: string;
	name: string;
	teamSize: number;
}

interface Result {
	userId: string;
	email: string;
	participant1Name: string;
	participant1RollNo: string;
	participant2Name?: string | null;
	participant2RollNo?: string | null;
	score: number;
	submittedAt: number;
	submittedAtFormatted: string;
	timeConsumedFormatted?: string | null;
	timeConsumedMinutes?: number;
}

type SortColumn = "score" | "timeConsumedMinutes" | null;
type SortDirection = "asc" | "desc";

// API fetchers
const fetchQuizzes = async (): Promise<QuizName[]> => {
	const res = await fetch("/api/quiznames");
	const data = await res.json();
	if (!data.success) throw new Error("Failed to load quizzes");
	return data.data;
};

const fetchResults = async (quizId: string): Promise<Result[]> => {
	const res = await fetch(`/api/results?quizId=${quizId}`);
	const data = await res.json();
	return data.results ?? [];
};

function Results() {
	const [selectedQuiz, setSelectedQuiz] = useState<string>("");
	const [debouncedSelectedQuiz] = useDebounce(selectedQuiz, 300);

	const [sortColumn, setSortColumn] = useState<SortColumn>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Queries
	const {
		data: quizzes = [],
		isLoading: quizzesLoading,
		isError: quizzesError,
		error: quizzesErrorObj,
	} = useQuery<QuizName[], Error>({
		queryKey: ["quizzes"],
		queryFn: fetchQuizzes,
		staleTime: 10 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const {
		data: results = [],
		isLoading: resultsLoading,
		isFetching: resultsFetching,
		isError: resultsError,
		error: resultsErrorObj,
		isFetched: resultsFetched,
	} = useQuery<Result[], Error>({
		queryKey: ["results", debouncedSelectedQuiz],
		queryFn: () => fetchResults(debouncedSelectedQuiz),
		enabled: !!debouncedSelectedQuiz,
		staleTime: 10 * 60 * 1000, // Increased to match quizzes (10 minutes)
		gcTime: 60 * 60 * 1000, // Keep same (1 hour)
		placeholderData: keepPreviousData,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		retry: 2,
		// Removed networkMode: "offlineFirst" for consistent behavior
	});

	useEffect(() => {
		if (!selectedQuiz && quizzes.length > 0 && quizzes[0]) {
			setSelectedQuiz(quizzes[0].id);
		}
	}, [quizzes, selectedQuiz]);

	// Sorting
	const sortedResults = useMemo(() => {
		if (!sortColumn) return results;
		const dir = sortDirection === "asc" ? 1 : -1;

		return [...results].sort((a, b) => {
			let valA = 0,
				valB = 0;
			if (sortColumn === "score") {
				valA = a.score;
				valB = b.score;
			} else if (sortColumn === "timeConsumedMinutes") {
				valA = a.timeConsumedMinutes ?? 0;
				valB = b.timeConsumedMinutes ?? 0;
			}
			return (valA - valB) * dir;
		});
	}, [results, sortColumn, sortDirection]);

	const handleSort = (col: SortColumn) => {
		setSortColumn((prev) => {
			if (prev === col) {
				setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
			} else {
				setSortDirection("asc");
			}
			return col;
		});
	};

	const quizOptions = useMemo(
		() => quizzes.map((q) => ({ value: q.id, label: q.name })),
		[quizzes]
	);

	const downloadExcel = useCallback(() => {
		if (results.length === 0) return;
		const worksheetData = results.map((r) => ({
			"Participant 1": r.participant1Name,
			"Roll No 1": r.participant1RollNo,
			"Participant 2": r.participant2Name || "",
			"Roll No 2": r.participant2RollNo || "",
			Email: r.email,
			Score: r.score,
			"Submitted At": r.submittedAtFormatted,
			"Time Taken": r.timeConsumedFormatted || "",
		}));

		const worksheet = XLSX.utils.json_to_sheet(worksheetData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
		XLSX.writeFile(workbook, `quiz_results_${selectedQuiz}.xlsx`);
	}, [results, selectedQuiz]);

	// Render helpers
	const renderError = (msg: string) => (
		<div className="flex flex-col items-center justify-center text-red-500 mt-12">
			<TriangleAlert size={52} className="mb-3" />
			<p className="text-lg font-medium">{msg}</p>
		</div>
	);

	const renderEmpty = (msg: string) => (
		<div className="flex flex-col items-center justify-center text-gray-500 mt-12">
			<TriangleAlert size={52} className="mb-3 text-amber-500" />
			<p className="text-lg font-medium">{msg}</p>
		</div>
	);

	const renderLoading = (msg: string) => (
		<div className="flex flex-col items-center justify-center py-12">
			<div className="h-10 w-10 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
			<p className="mt-3 text-gray-600 text-sm">{msg}</p>
		</div>
	);

	const renderTable = () => (
		<div className="px-3">
			<div className="overflow-x-auto border border-neutral-800/30 rounded-lg shadow-sm">
				{resultsFetching && (
					<div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
						Refreshing results…
					</div>
				)}
				<table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
					<thead className="bg-black/90 text-gray-300">
						<tr>
							{[
								"Participant 1",
								"Roll No 1",
								"Participant 2",
								"Roll No 2",
								"Email",
							].map((col) => (
								<th
									key={col}
									className="px-6 py-3 text-left text-[10px] font-bold  uppercase tracking-wider"
								>
									{col}
								</th>
							))}
							<th
								onClick={() => handleSort("score")}
								className="flex gap-1 items-center px-6 py-3 text-left text-[10px] font-medium  uppercase tracking-wider cursor-pointer select-none"
							>
								Score{" "}
								{sortColumn === "score" &&
									(sortDirection === "asc" ? (
										<ChevronUp size={12} />
									) : (
										<ChevronDown size={12} />
									))}
							</th>
							<th className="px-6 py-3 text-left text-[10px] font-medium  uppercase tracking-wider">
								Submitted At
							</th>
							<th
								onClick={() => handleSort("timeConsumedMinutes")}
								className="flex gap-1 items-center px-6 py-3 text-left text-[10px] font-medium  uppercase tracking-wider cursor-pointer select-none"
							>
								Time Taken{" "}
								{sortColumn === "timeConsumedMinutes" &&
									(sortDirection === "asc" ? (
										<ChevronUp size={12} />
									) : (
										<ChevronDown size={12} />
									))}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{sortedResults.map((r, idx) => (
							<tr
								key={r.userId}
								className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
							>
								<td
									className="px-6 py-4 max-w-[150px] truncate overflow-hidden text-ellipsis whitespace-nowrap"
									title={r.participant1Name}
								>
									{r.participant1Name}
								</td>
								<td
									className="px-6 py-4 max-w-[120px] truncate overflow-hidden text-ellipsis whitespace-nowrap"
									title={r.participant1RollNo}
								>
									{r.participant1RollNo}
								</td>
								<td
									className="px-6 py-4 max-w-[150px] truncate overflow-hidden text-ellipsis whitespace-nowrap"
									title={r.participant2Name || "N/A"}
								>
									{r.participant2Name || "N/A"}
								</td>
								<td
									className="px-6 py-4 max-w-[120px] truncate overflow-hidden text-ellipsis whitespace-nowrap"
									title={r.participant2RollNo || "N/A"}
								>
									{r.participant2RollNo || "N/A"}
								</td>
								<td
									className="px-6 py-4 max-w-[220px] truncate overflow-hidden text-ellipsis whitespace-nowrap"
									title={r.email}
								>
									{r.email}
								</td>
								<td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
									{r.score}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									{r.submittedAtFormatted}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									{r.timeConsumedFormatted || "N/A"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);

	// Main render
	let content;
	if (quizzesError) content = renderError(quizzesErrorObj?.message ?? "Error");
	else if (quizzesLoading) content = renderLoading("Loading quizzes...");
	else if (quizzes.length === 0) content = renderEmpty("No quizzes available");
	else if (resultsError)
		content = renderError(resultsErrorObj?.message ?? "Error");
	else if (
		resultsLoading ||
		(selectedQuiz && results.length === 0 && !resultsFetched)
	)
		content = renderLoading("Loading results...");
	else if (resultsFetched && results.length === 0)
		content = renderEmpty("No submissions yet");
	else if (results.length > 0) content = renderTable();
	else if (selectedQuiz && !resultsLoading && !resultsFetched)
		content = renderLoading("Loading results...");

	return (
		<div className="flex flex-col h-full  bg-gray-50">
			{/* Header */}
			<div className="flex p-3 justify-between items-center border-b pb-2 border-neutral-800/20 mb-6">
				<div>
					<h2 className="text-3xl font-semibold text-gray-800">Quiz Results</h2>
					<span className="text-gray-500 text-sm">
						Select a quiz to see detailed results
					</span>
				</div>
				<div className="flex gap-2 items-center w-1/3">
					{quizzesLoading ? (
						<div className="flex items-center justify-center flex-1">
							<div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
						</div>
					) : (
						<CustomSelect
							value={selectedQuiz}
							onChange={setSelectedQuiz}
							options={quizOptions}
							placeholder={
								quizzes.length === 0 ? "No quizzes available" : "Select a quiz"
							}
							className="flex-1"
							stylePropsOfSelect="px-3 py-2 rounded-lg"
						/>
					)}
					{selectedQuiz && results.length > 0 && !resultsLoading && (
						<button
							onClick={downloadExcel}
							className="flex items-center gap-1 px-3 py-2 bg-accent text-black rounded-md hover:bg-accentLight transition"
						>
							<Download size={16} /> Download
						</button>
					)}
				</div>
			</div>

			{content}
		</div>
	);
}

export default Results;

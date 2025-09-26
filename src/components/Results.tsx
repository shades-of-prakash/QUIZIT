import React, { useMemo, useState, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import CustomSelect from "./CustomSelect";
import { Download, ChevronUp, ChevronDown, RefreshCcw } from "lucide-react";
import select from "../assets/select.svg";
import { useQuiz } from "../context/quizNamesContext";
import Error from "../assets/Error.svg";

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

// Fetch paginated results for infinite scroll
const fetchResults = async ({
	quizId,
	pageParam = 1,
	limit = 20,
}: {
	quizId: string;
	pageParam?: number;
	limit?: number;
}) => {
	const res = await fetch(
		`/api/results?quizId=${quizId}&page=${pageParam}&limit=${limit}`
	);
	const data = await res.json();
	return {
		results: data.results ?? [],
		nextPage: pageParam < data.totalPages ? pageParam + 1 : undefined,
	};
};

// Download all results via backend CSV endpoint
const downloadCSV = async (quizId: string) => {
	const res = await fetch(`/api/results/download?quizId=${quizId}`);
	const blob = await res.blob();
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `quiz_results_${quizId}.csv`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};

function Results() {
	const {
		quizSelectOptions,
		loading: quizzesLoading,
		errors,
		reloadQuizzes,
	} = useQuiz();

	const [selectedQuiz, setSelectedQuiz] = useState<string>(
		() => localStorage.getItem("selectedQuiz") || ""
	);
	const [debouncedSelectedQuiz] = useDebounce(selectedQuiz, 300);

	const [sortColumn, setSortColumn] = useState<SortColumn>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	React.useEffect(() => {
		if (selectedQuiz) localStorage.setItem("selectedQuiz", selectedQuiz);
		else localStorage.removeItem("selectedQuiz");
	}, [selectedQuiz]);

	// Infinite scroll query
	const {
		data: infiniteData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: resultsLoading,
		isError: resultsError,
		error: resultsErrorObj,
		isFetched: resultsFetched,
	} = useInfiniteQuery<{ results: Result[]; nextPage?: number }, Error>({
		queryKey: ["results", debouncedSelectedQuiz],
		queryFn: ({ pageParam = 1 }) =>
			fetchResults({
				quizId: debouncedSelectedQuiz,
				pageParam: pageParam as number,
			}),
		enabled: !!debouncedSelectedQuiz,
		initialPageParam: 1,
		getNextPageParam: (lastPage) => lastPage?.nextPage,
		staleTime: 10 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	const results: Result[] = useMemo(
		() => infiniteData?.pages.flatMap((p) => p.results) ?? [],
		[infiniteData]
	);

	// find selected quiz object to get teamSize
	const selectedQuizObj = quizSelectOptions.find((q) => q.value === selectedQuiz);
	const teamSize = selectedQuizObj?.teamSize ?? 1;

	// Infinite scroll observer
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		if (!loadMoreRef.current || !hasNextPage) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && hasNextPage) fetchNextPage();
			},
			{ threshold: 1.0 }
		);
		observer.observe(loadMoreRef.current);
		return () => observer.disconnect();
	}, [hasNextPage, fetchNextPage]);

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
			if (prev === col) setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
			else setSortDirection("asc");
			return col;
		});
	};

	const handleDownload = useCallback(() => {
		if (!selectedQuiz) return;
		downloadCSV(selectedQuiz);
	}, [selectedQuiz]);

	const renderEmpty = () => (
		<div className="flex flex-col items-center justify-center text-gray-500 mt-12">
			<img src={select} alt="select-svg" className="w-[300px]" />
			<p className="text-lg mt-4 font-medium">Select a quiz to see results</p>
		</div>
	);

	const renderMessage = (msg: string) => (
		<div className="flex flex-col items-center justify-center mt-12 text-gray-500">
			<img src={Error} alt="error-image" className="w-[300px]" />
			<p className="text-lg mt-4 font-medium">{msg}</p>
		</div>
	);

	const renderLoading = (msg: string) => (
		<div className="flex flex-col items-center justify-center mt-12 text-gray-500">
			<div className="h-10 w-10 border-4 border-gray-300 border-t-accent rounded-full animate-spin mb-4" />
			<p className="text-lg font-medium">{msg}</p>
		</div>
	);

	const renderTable = () => (
		<div className="px-3 flex-1 overflow-hidden">
			<div className="mt-3 max-h-[600px] overflow-x-auto border border-neutral-800/30 rounded-lg shadow-sm flex flex-col">
				<div className="overflow-y-auto flex-1">
					<table className="min-w-full divide-y divide-gray-200 bg-white">
						<thead className="bg-black/90 text-gray-300 sticky top-0 z-10">
							<tr>
								<th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
									S.No
								</th>
								<th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
									Participant 1
								</th>
								<th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
									Roll No 1
								</th>
								{teamSize > 1 && (
									<>
										<th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
											Participant 2
										</th>
										<th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
											Roll No 2
										</th>
									</>
								)}
								<th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
									Email
								</th>
								<th
									onClick={() => handleSort("score")}
									className="flex gap-1 items-center px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider cursor-pointer select-none"
								>
									Score{" "}
									{sortColumn === "score" &&
										(sortDirection === "asc" ? (
											<ChevronUp size={12} />
										) : (
											<ChevronDown size={12} />
										))}
								</th>
								<th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider">
									Submitted At
								</th>
								<th
									onClick={() => handleSort("timeConsumedMinutes")}
									className="flex gap-1 items-center px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider cursor-pointer select-none"
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
									key={r.userId + idx}
									className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
								>
									<td className="px-6 py-4">{idx + 1}</td>
									<td className="px-6 py-4">{r.participant1Name}</td>
									<td className="px-6 py-4">{r.participant1RollNo}</td>
									{teamSize > 1 && (
										<>
											<td className="px-6 py-4">{r.participant2Name || "N/A"}</td>
											<td className="px-6 py-4">{r.participant2RollNo || "N/A"}</td>
										</>
									)}
									<td
										className="px-6 py-4 max-w-[200px] truncate"
										title={r.email}
									>
										{r.email}
									</td>
									<td className="px-6 py-4">{r.score}</td>
									<td className="px-6 py-4">{r.submittedAtFormatted}</td>
									<td className="px-6 py-4">
										{r.timeConsumedFormatted || "N/A"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{hasNextPage && (
						<div
							ref={loadMoreRef}
							className="py-4 text-center text-sm text-gray-500"
						>
							{isFetchingNextPage ? (
								<div className="flex justify-center">
									<div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
								</div>
							) : (
								"Scroll to load more"
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);

	let content;

	if (!selectedQuiz) {
		content = renderEmpty();
	} else if (errors.global) {
		content = renderMessage(errors.global);
	} else if (quizzesLoading) {
		content = renderMessage("Loading quizzes...");
	} else if (resultsError) {
		content = renderMessage(resultsErrorObj?.message ?? "Error");
	} else if (resultsLoading && results.length === 0) {
		content = renderLoading("Loading results...");
	} else if (resultsFetched && results.length === 0) {
		content = renderMessage("No submissions yet");
	} else if (results.length > 0) {
		content = renderTable();
	}

	return (
		<div className="flex flex-col h-full bg-gray-50">
			{/* Header */}
			<div className="flex p-3 justify-between items-center border-b pb-2 border-neutral-800/20 mb-2">
				<div>
					<h2 className="text-xl font-semibold text-gray-800">Quiz Results</h2>
					<span className="text-gray-500 text-sm">
						Select a quiz to see detailed results
					</span>
				</div>
				<div className="flex gap-2 items-center w-1/3">
					<button
						onClick={reloadQuizzes}
						className="p-3 rounded-md border border-gray-300 hover:bg-gray-100 transition"
						title="Refresh quizzes"
					>
						<RefreshCcw size={16} className="text-gray-600" />
					</button>
					{quizzesLoading ? (
						<div className="flex items-center justify-center flex-1">
							<div className="h-6 w-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
						</div>
					) : (
						<CustomSelect
							value={selectedQuiz}
							onChange={setSelectedQuiz}
							options={quizSelectOptions}
							placeholder={
								quizSelectOptions.length === 0
									? "No quizzes available"
									: "Select a quiz"
							}
							className="flex-1"
							stylePropsOfSelect="px-3 py-2 rounded-lg"
						/>
					)}
					{selectedQuiz && results.length > 0 && (
						<button
							onClick={handleDownload}
							className="flex items-center gap-1 px-3 py-2 bg-accent text-black rounded-md hover:bg-accentLight transition"
						>
							<Download size={16} /> Download
						</button>
					)}
				</div>
			</div>

			<div className="w-full flex flex-col">
				<div className="">{content}</div>
			</div>
		</div>
	);
}

export default Results;

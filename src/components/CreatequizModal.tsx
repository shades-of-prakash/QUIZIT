import { useState, type ChangeEvent } from "react";
import { X, Upload } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import CustomSelect from "./CustomSelect";

interface CreateQuizModalProps {
	onClose: () => void;
	refreshQuizzes: () => void;
}

export default function CreateQuizModal({
	onClose,
	refreshQuizzes,
}: CreateQuizModalProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [quizName, setQuizName] = useState("");
	const [questions, setQuestions] = useState("");
	const [duration, setDuration] = useState("");
	const [teamSize, setTeamSize] = useState("");
	const [parsedData, setParsedData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const teamSizeOptions = [
		{ value: "1", label: "Individual" },
		{ value: "2", label: "Duo" },
	];

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);

			Papa.parse(file, {
				header: true,
				skipEmptyLines: true,
				complete: (result) => {
					try {
						const formatted = result.data.map((row: any, index: number) => {
							const rowNumber = index + 2;
							console.log("row", row);
							const options = [
								row.option1,
								row.option2,
								row.option3,
								row.option4,
							].filter(Boolean);

							console.log(options);

							let correctOptions: number[] = [];

							if (row.answers) {
								const rawValue = String(row.answers).trim();

								const regex = /^[0-9]+(?:\|[0-9]+)*$/;

								if (!regex.test(rawValue)) {
									throw new Error(
										`Error at row ${rowNumber}: correct_options must only contain numbers like "1" or "1|2".`
									);
								}
								correctOptions = rawValue
									.split("|")
									.map((opt: string) => parseInt(opt, 10) - 1)
									.map((num: number) => {
										if (num < 0 || num >= options.length) {
											throw new Error(
												`Error at row ${rowNumber}: correct_options contains a number outside the valid range (1–${options.length}).`
											);
										}
										return num;
									});
							}

							return {
								sno: row.sno,
								question: row.question,
								options,
								correct_options: correctOptions,
								multiple: String(row.multiple).toLowerCase() === "true",
							};
						});

						setParsedData(formatted);
						console.log("Parsed CSV:", formatted);
					} catch (err: any) {
						const message =
							typeof err.message === "string"
								? err.message
								: "Error: Invalid correct_options format.";
						toast.error(message);
						setParsedData([]);
						setSelectedFile(null);
					}
				},
			});
		}
	};

	const isFormValid =
		Boolean(selectedFile) &&
		quizName.trim().length > 0 &&
		questions.trim().length > 0 &&
		duration.trim().length > 0 &&
		teamSize.trim().length > 0;

	const handleCreateQuiz = async () => {
		if (!isFormValid) return;

		setLoading(true);

		try {
			const response = await fetch("/api/create-quiz", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					name: quizName,
					duration: parseInt(duration),
					quizQuestions: parseInt(questions),
					totalQuestions: parsedData.length,
					teamSize: parseInt(teamSize),
					questions: parsedData,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success("Quiz created successfully!");
				refreshQuizzes();
				onClose();
			} else {
				toast.error(data.message || "Failed to create quiz");
			}
		} catch (error) {
			console.error("Create quiz error:", error);
			toast.error("Server error while creating quiz.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed z-10 top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
			<div className="flex flex-col gap-1 w-[800px] h-auto bg-white p-4 rounded-md">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-xl">Create New Quiz</h2>
					<button
						onClick={onClose}
						className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 hover:border rounded-full hover:border-neutral-400"
					>
						<X />
					</button>
				</div>

				<div className="flex w-full flex-1 border border-neutral-200 rounded-md">
					{/* Upload Section */}
					<div className="w-1/2 flex-1 rounded-md p-4 pr-3">
						<div className="w-full h-full flex flex-col items-center justify-center rounded-md bg-[#8fd45a2e] border border-dashed border-neutral-500 p-4">
							<Upload className="w-10 h-10 text-neutral-600 mb-2" />
							<p className="text-base text-neutral-600">
								Upload your quiz file
							</p>

							<input
								id="file-upload"
								type="file"
								accept=".csv"
								className="hidden"
								onChange={handleFileChange}
							/>
							<p className="m-2 text-sm text-neutral-500 italic">
								Only .csv files are accepted
							</p>
							<label
								htmlFor="file-upload"
								className="px-4 py-2 bg-black text-white rounded-md cursor-pointer hover:bg-neutral-800 transition"
							>
								Browse file
							</label>

							{selectedFile && (
								<p className="mt-3  text-2xl text-black b text-center bg-transparent border border-neutral-800/40 rounded-md py-1 px-2">
									{selectedFile.name}
								</p>
							)}
						</div>
					</div>

					{/* Quiz Details Section */}
					<div className="w-1/2 flex-1 flex flex-col justify-between p-4 pl-0">
						<div className="flex flex-col h-full w-full gap-4">
							<h1 className="text-xl font-bold text-neutral-700">
								Enter Quiz Details
							</h1>
							<div className="flex flex-col gap-2">
								<label htmlFor="quiz-name" className="font-medium">
									Name
								</label>
								<input
									id="quiz-name"
									type="text"
									value={quizName}
									onChange={(e) => setQuizName(e.target.value)}
									className="border border-neutral-800/30 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter quiz name"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="quiz-questions" className="font-medium">
									Number of questions
								</label>
								<input
									id="quiz-questions"
									type="number"
									min="1"
									value={questions}
									onChange={(e) => setQuestions(e.target.value)}
									className="border border-neutral-800/30 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g., 10"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="quiz-duration" className="font-medium">
									Duration (minutes)
								</label>
								<input
									id="quiz-duration"
									type="number"
									min="1"
									value={duration}
									onChange={(e) => setDuration(e.target.value)}
									className="border border-neutral-800/30 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="e.g., 30"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="quiz-team-size" className="font-medium">
									Team Size
								</label>
								<CustomSelect
									value={teamSize}
									onChange={setTeamSize}
									options={teamSizeOptions}
									placeholder="Select team size"
									className="w-full"
								/>
							</div>
						</div>

						<div className="w-full flex justify-end mt-5">
							<button
								onClick={handleCreateQuiz}
								disabled={!isFormValid || loading}
								className={`px-6 py-2 font-semibold rounded-md transition-all ${
									isFormValid && !loading
										? "bg-black text-white hover:bg-neutral-800 cursor-pointer"
										: "bg-gray-300 text-gray-500 cursor-not-allowed"
								}`}
							>
								{loading ? "Creating..." : "Create"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

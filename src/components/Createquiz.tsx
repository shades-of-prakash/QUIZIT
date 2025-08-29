import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CreateQuizModal from "./CreatequizModal";
import { useNavigate } from "react-router";
import Box from "../assets/box.png";
import CreateUsers from "./CreateUsers";
import { Divide } from "lucide-react";
interface Quiz {
	id: string;
	name: string;
	questions: number;
	quizQuestions: number;
	duration: string;
}

const fetchQuizzes = async (): Promise<Quiz[]> => {
	const res = await fetch("/api/getquizzes", { credentials: "include" });
	if (!res.ok) throw new Error("Failed to fetch quizzes");
	const data = await res.json();
	return data.map((quiz: any) => ({
		id: quiz._id || quiz.id,
		name: quiz.name,
		questions: quiz.totalQuestions || quiz.questions || 0,
		quizQuestions: quiz.quizQuestions,
		duration: quiz.duration || "N/A",
	}));
};

// const deleteQuiz = async (id: string) => {
// 	const res = await fetch(`/api/deletequiz/${id}`, {
// 		method: "DELETE",
// 		credentials: "include",
// 	});
// 	if (!res.ok) throw new Error("Failed to delete quiz");
// };

export default function Createquiz() {
	const [showModal, setShowModal] = useState(false);
	const [usersPopUp, setUsersPopUp] = useState(false);
	const navigate = useNavigate();

	const {
		data: quizzes = [],
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery<Quiz[], Error>({
		queryKey: ["quizzes"],
		queryFn: fetchQuizzes,
	});

	// const deleteMutation = useMutation<void, Error, string>(deleteQuiz, {
	// 	onSuccess: () => {
	// 		refetch();
	// 	},
	// });

	const handleModalToggle = () => setShowModal((prev) => !prev);
	const handleUsersPopUpToggle = () => setUsersPopUp((prev) => !prev);

	const handleDelete = (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		// if (confirm("Are you sure you want to delete this quiz?")) {
		// 	deleteMutation.mutate(id);
		// }
	};

	return (
		<div className="w-full h-full flex flex-col bg-green-950">
			{/* Header */}
			<header className="flex items-center justify-between h-14 bg-white border-b border-neutral-100 px-4">
				<div className="flex flex-col">
					<h1 className="text-xl font-bold">Create New Quiz</h1>
					<p className="text-sm text-gray-600">
						Ensure all questions are correct before saving.
					</p>
				</div>
				<button
					className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
					onClick={handleModalToggle}
				>
					Create Quiz
				</button>
			</header>

			{/* Table / Content */}
			<main className="flex-1 bg-white p-4 overflow-x-auto">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-16">
						<div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
						<p className="text-gray-600">Loading quizzes...</p>
					</div>
				) : isError ? (
					<p className="text-red-600">Error: {error?.message}</p>
				) : quizzes.length === 0 ? (
					<EmptyState />
				) : (
					<QuizTable
						quizzes={quizzes}
						onNavigate={(id) => navigate(`${id}`)}
						onUsersClick={handleUsersPopUpToggle}
						onDelete={handleDelete}
					/>
				)}
			</main>

			{usersPopUp && (
				<div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="w-[800px] h-[400px] bg-white p-4 relative">
						<button
							className="absolute top-2 right-2 text-gray-600 hover:text-black"
							onClick={handleUsersPopUpToggle}
						>
							✕
						</button>
						{/* Users creation content goes here */}
					</div>
				</div>
			)}

			{showModal && (
				<CreateQuizModal onClose={handleModalToggle} refreshQuizzes={refetch} />
			)}
		</div>
	);
}

const EmptyState = () => (
	<div className="flex border border-neutral-400 rounded-md flex-col items-center justify-center py-16 text-gray-500">
		<img src={Box} alt="No quizzes" className="w-16 h-16 mb-4" />
		<p>No quizzes available</p>
	</div>
);

interface QuizTableProps {
	quizzes: Quiz[];
	onNavigate: (id: string) => void;
	onUsersClick: () => void;
	onDelete: (e: React.MouseEvent, id: string) => void;
}

const QuizTable = ({
	quizzes,
	onNavigate,
	onUsersClick,
	onDelete,
}: QuizTableProps) => {
	const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

	return (
		<div className="overflow-hidden rounded-md border border-gray-300 shadow-sm">
			<table className="w-full text-sm">
				<thead className="bg-neutral-100">
					<tr>
						<th className="px-4 py-2 text-left">#</th>
						<th className="px-4 py-2 text-left">Name</th>
						<th className="px-4 py-2 text-center">Total Questions</th>
						<th className="px-4 py-2 text-center">Questions/Quiz</th>
						<th className="px-4 py-2 text-center">Duration</th>
						<th className="px-4 py-2 text-center">Actions</th>
					</tr>
				</thead>
				<tbody>
					{quizzes.map((quiz, index) => (
						<tr
							key={quiz.id}
							onClick={() => onNavigate(quiz.id)}
							className="border-t border-gray-200 hover:bg-gray-50 transition cursor-pointer"
						>
							<td className="px-4 py-2">{index + 1}</td>
							<td className="px-4 py-2">{quiz.name}</td>
							<td className="px-4 py-2 text-center">{quiz.questions}</td>
							<td className="px-4 py-2 text-center">{quiz.quizQuestions}</td>
							<td className="px-4 py-2 text-center">{quiz.duration}</td>
							<td className="px-4 py-2 flex gap-2 justify-center">
								<button
									onClick={(e) => {
										e.stopPropagation();
										setSelectedQuiz(quiz);
									}}
									className="border border-green-600 text-green-700 hover:bg-green-50 rounded-md px-3 py-1 transition"
								>
									Create Users
								</button>
								<button
									onClick={(e) => onDelete(e, quiz.id)}
									className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-md transition"
								>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{selectedQuiz && (
				<CreateUsers
					quizId={selectedQuiz.id}
					quizName={selectedQuiz.name}
					onClose={() => setSelectedQuiz(null)}
				/>
			)}
		</div>
	);
};

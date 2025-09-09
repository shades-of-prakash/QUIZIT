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

const deleteQuiz = async (id: string) => {
	const res = await fetch(`/api/deletequiz?quizId=${id}`, {
		method: "GET",
		credentials: "include",
	});
	if (!res.ok) throw new Error("Failed to delete quiz");
};

export default function Createquiz() {
	const [showModal, setShowModal] = useState(false);
	const [usersPopUp, setUsersPopUp] = useState(false);
	const [deletePopup, setDeletePopup] = useState<{
		show: boolean;
		quizId: string;
		quizName: string;
	}>({
		show: false,
		quizId: "",
		quizName: "",
	});
	const navigate = useNavigate();

	const {
		data: quizzes = [],
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery<Quiz[], Error>({
		queryKey: ["quizzes1"],
		queryFn: fetchQuizzes,
	});

	const deleteMutation = useMutation<void, Error, string>({
		mutationFn: deleteQuiz,
		onSuccess: () => {
			refetch();
			setDeletePopup({ show: false, quizId: "", quizName: "" });
		},
		onError: (error) => {
			console.error("Error deleting quiz:", error);
		},
	});

	const handleModalToggle = () => setShowModal((prev) => !prev);
	const handleUsersPopUpToggle = () => setUsersPopUp((prev) => !prev);

	const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
		e.stopPropagation();
		setDeletePopup({ show: true, quizId: id, quizName: name });
	};

	const handleDeleteConfirm = (quizId: string) => {
		deleteMutation.mutate(quizId);
	};

	const handleDeleteCancel = () => {
		setDeletePopup({ show: false, quizId: "", quizName: "" });
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
					<div className="w-full h-full flex flex-col items-center justify-center py-16">
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

			{/* Delete Confirmation Popup */}
			{deletePopup.show && (
				<DeleteConfirmationPopup
					quizName={deletePopup.quizName}
					quizId={deletePopup.quizId}
					onConfirm={handleDeleteConfirm}
					onCancel={handleDeleteCancel}
					isDeleting={deleteMutation.isPending}
					error={deleteMutation.error}
				/>
			)}

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
	onDelete: (e: React.MouseEvent, id: string, name: string) => void;
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
				<thead className="bg-black/90 text-gray-300">
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
									onClick={(e) => onDelete(e, quiz.id, quiz.name)}
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

interface DeleteConfirmationPopupProps {
	quizName: string;
	quizId: string;
	onConfirm: (quizId: string) => void;
	onCancel: () => void;
	isDeleting: boolean;
	error: Error | null;
}

const DeleteConfirmationPopup = ({
	quizName,
	quizId,
	onConfirm,
	onCancel,
	isDeleting,
	error,
}: DeleteConfirmationPopupProps) => {
	const [inputValue, setInputValue] = useState("");
	const isDeleteEnabled = inputValue.toLowerCase() === "delete";

	return (
		<div className="fixed inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
			<div className="bg-white rounded-lg p-6 w-[480px] max-w-full mx-4">
				<h2 className="text-xl font-bold mb-4 text-red-600">Delete Quiz</h2>
				<p className="text-gray-700 mb-4">
					Are you sure you want to delete the quiz "{quizName}"? This action
					cannot be undone.
				</p>
				<p className="text-sm text-gray-600 mb-4">
					Type <strong>delete</strong> to confirm:
				</p>
				<input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
					placeholder="Type 'delete' to confirm"
					disabled={isDeleting}
				/>

				{error && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
						<p className="text-red-700 text-sm">
							<strong>Error:</strong> {error.message}
						</p>
					</div>
				)}

				<div className="flex gap-3 justify-end">
					<button
						onClick={onCancel}
						disabled={isDeleting}
						className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onClick={() => onConfirm(quizId)}
						disabled={!isDeleteEnabled || isDeleting}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</button>
				</div>
			</div>
		</div>
	);
};

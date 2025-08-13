import { useState } from "react";
import CreateQuizModal from "./CreatequizModal";

interface Quiz {
	id: number;
	name: string;
	questions: number;
	duration: string;
}

export default function Createquiz() {
	const [showModal, setShowModal] = useState(false);

	const handleModal = () => {
		setShowModal((prev) => !prev);
	};

	const quizzes: Quiz[] = [
		{ id: 1, name: "JavaScript Basics", questions: 10, duration: "15 min" },
		{ id: 2, name: "React Fundamentals", questions: 12, duration: "20 min" },
		{ id: 3, name: "Node.js Advanced", questions: 15, duration: "25 min" },
	];

	return (
		<div className="w-full h-full flex flex-col bg-green-950">
			{/* Header */}
			<div className="flex items-center justify-between h-14 bg-white border-b border-neutral-100 p-4">
				<div className="flex flex-col">
					<h1 className="text-xl font-bold">Create New Quiz</h1>
					<span className="text-sm">
						Make sure all questions are correct before saving.
					</span>
				</div>
				<button
					className="bg-black text-white px-4 py-2 rounded-md"
					onClick={handleModal}
				>
					Create Quiz
				</button>
			</div>

			{/* Table */}
			<div className="flex-1 bg-white p-4 overflow-x-auto">
				<div className="rounded-md overflow-hidden border border-gray-300 shadow-sm">
					<table className="w-full text-sm">
						<thead className="bg-neutral-100">
							<tr>
								<th className="px-4 py-2 text-left">#</th>
								<th className="px-4 py-2 text-left">Name</th>
								<th className="px-4 py-2 text-center">Number of Questions</th>
								<th className="px-4 py-2 text-center">Duration</th>
								<th className="px-4 py-2 text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{quizzes.map((quiz, index) => (
								<tr
									key={quiz.id}
									className="border-t border-gray-200 hover:bg-gray-50 transition"
								>
									<td className="px-4 py-2">{index + 1}</td>
									<td className="px-4 py-2">{quiz.name}</td>
									<td className="px-4 py-2 text-center">{quiz.questions}</td>
									<td className="px-4 py-2 text-center">{quiz.duration}</td>
									<td className="px-4 py-2 flex gap-2 justify-center">
										<button className="border border-green-600 text-green-700 hover:bg-accent hover:text-black rounded-md px-3 py-1 transition">
											Create Users
										</button>
										<button className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-md transition">
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Modal */}
			{showModal && <CreateQuizModal onClose={handleModal} />}
		</div>
	);
}

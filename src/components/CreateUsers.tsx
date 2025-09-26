import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateUsersProps {
	quizId: string;
	quizName: string;
	onClose: () => void;
}

interface CreateUsersResponse {
	message: string;
	users: { username: string; password: string }[];
}

// API call
const createQuizUsers = async ({
	quizId,
	count,
}: {
	quizId: string;
	count: number;
}) => {
	const res = await fetch("/api/create-quiz-users", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ quizId, count }),
	});
	const data: CreateUsersResponse = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to create users");
	return data;
};

// CSV download
const downloadCSV = (
	users: { username: string; password: string }[],
	quizName: string
) => {
	const header = "Username,Password\n";
	const rows = users.map((u) => `${u.username},${u.password}`).join("\n");
	const csv = header + rows;

	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = `${quizName}-users.csv`;
	link.click();

	URL.revokeObjectURL(url);
};

const CreateUsers: React.FC<CreateUsersProps> = ({
	quizId,
	quizName,
	onClose,
}) => {
	const [numUsers, setNumUsers] = useState<number | "">("");
	const [error, setError] = useState<string>("");
	const [createdUsers, setCreatedUsers] = useState<
		{ username: string; password: string }[] | null
	>(null);

	const mutation = useMutation({
		mutationFn: createQuizUsers,
		onSuccess: (data) => {
			toast.success("Users created successfully!");
			setCreatedUsers(data.users);
		},
		onError: (err: any) => {
			setError(err.message || "Something went wrong");
		},
	});

	// input validation
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value === "") {
			setNumUsers("");
			setError("");
			return;
		}
		const parsed = parseInt(value, 10);
		if (!isNaN(parsed)) {
			if (parsed < 1) {
				setError("Please enter at least 1 user.");
			} else if (parsed > 5000) {
				setError("Number of users cannot exceed 5000.");
			} else {
				setError("");
			}
			setNumUsers(parsed);
		}
	};

	const handleGenerate = () => {
		if (!numUsers || numUsers <= 0) {
			setError("Please enter a valid number of users.");
			return;
		}
		if (numUsers > 5000) {
			setError("Number of users cannot exceed 5000.");
			return;
		}
		setCreatedUsers(null);
		mutation.mutate({ quizId, count: numUsers });
	};

	return (
		<div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center">
			<div className="w-[400px] flex flex-col gap-4 bg-white p-4 rounded-md shadow-lg relative">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-lg">
						Create Users for:{" "}
						<span className="bg-neutral-200 text-xs px-2 py-1 rounded-md">
							{quizName}
						</span>
					</h2>
					<button
						className="text-gray-600 hover:text-black text-xl font-bold"
						onClick={onClose}
						disabled={mutation.isPending}
					>
						✕
					</button>
				</div>

				{/* Input */}
				<div className="flex flex-col gap-2">
					<label htmlFor="numUsers" className="font-medium">
						Number of Users
					</label>
					<input
						id="numUsers"
						type="number"
						min={1}
						value={numUsers}
						onChange={handleChange}
						placeholder="Enter number of users"
						className={`border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							error ? "border-red-500" : "border-neutral-400"
						}`}
						disabled={mutation.isPending}
					/>
					{error && <p className="text-red-600 text-sm">{error}</p>}
				</div>

				{/* Success message */}
				{createdUsers && (
					<p className="text-green-600 font-medium text-sm">
						✅ Successfully created {createdUsers.length} users
					</p>
				)}

				{/* Actions */}
				<div className="flex items-center gap-2 justify-end">
					{/* Generate Button */}
					<button
						onClick={handleGenerate}
						className={`px-4 py-2 rounded-md text-white transition flex items-center justify-center gap-2 ${
							mutation.isPending ||
							!numUsers ||
							numUsers <= 0 ||
							numUsers > 5000 ||
							!!error
								? "bg-gray-400 cursor-not-allowed"
								: "bg-neutral-800 hover:bg-neutral-900"
						}`}
						disabled={
							mutation.isPending ||
							!numUsers ||
							numUsers <= 0 ||
							numUsers > 5000 ||
							!!error
						}
					>
						{mutation.isPending ? (
							<>
								<svg
									className="animate-spin h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<span>Generating...</span>
							</>
						) : (
							"Generate"
						)}
					</button>

					{/* Download CSV */}
					<button
						onClick={() => createdUsers && downloadCSV(createdUsers, quizName)}
						disabled={!createdUsers}
						className={`px-4 font-bold py-2 rounded-md transition ${
							createdUsers
								? "bg-accent text-black hover:bg-[#abff6b]"
								: "bg-gray-200 border border-neutral-400 text-black cursor-not-allowed"
						}`}
					>
						Download CSV
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreateUsers;

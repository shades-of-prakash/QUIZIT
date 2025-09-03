import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
// import loginImage from "../assets/login.png";
import loginImage from "../assets/login2.jpg";

import CustomSelect from "../components/CustomSelect";

const Step1 = ({
	formData,
	handleChange,
	handleQuizSelect,
	quizOptions,
	selectedQuizTeamSize,
}: {
	formData: any;
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleQuizSelect: (value: string) => void;
	quizOptions: { label: string; value: string; teamSize: number }[];
	selectedQuizTeamSize: number;
}) => (
	<>
		<div className="w-full flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Select Quiz</label>
			<CustomSelect
				value={formData.quizId}
				onChange={handleQuizSelect}
				options={quizOptions.map((q) => ({ value: q.value, label: q.label }))}
				placeholder="Select a quiz"
			/>
		</div>
		<div className="w-full flex flex-col gap-1 ">
			<legend className="font-medium">Participant 1</legend>
			<div className="flex gap-3">
				<div className="w-1/2 flex flex-col gap-2">
					<label className="text-sm text-neutral-800">Name</label>
					<input
						type="text"
						name="participant1Name"
						value={formData.participant1Name}
						onChange={handleChange}
						className="py-2 px-4 border border-neutral-800/40 rounded-md"
						placeholder="Enter name"
					/>
				</div>
				<div className="w-1/2 flex flex-col gap-2">
					<label className="text-sm text-neutral-800">Roll No</label>
					<input
						type="text"
						name="participant1RollNo"
						value={formData.participant1RollNo}
						onChange={handleChange}
						className="py-2 px-4 border border-neutral-800/40 rounded-md"
						placeholder="Enter roll number"
					/>
				</div>
			</div>
		</div>

		{/* Participant 2 - Only if teamSize > 1 */}
		{selectedQuizTeamSize > 1 && (
			<div className="w-full flex flex-col gap-1">
				<legend className="font-medium">Participant 2</legend>
				<div className="flex gap-3">
					<div className="w-1/2 flex flex-col gap-2">
						<label className="text-sm text-neutral-800">Name</label>
						<input
							type="text"
							name="participant2Name"
							value={formData.participant2Name}
							onChange={handleChange}
							className="py-2 px-4 border border-neutral-800/40 rounded-md"
							placeholder="Enter name"
						/>
					</div>
					<div className="w-1/2 flex flex-col gap-2">
						<label className="text-sm text-neutral-800">Roll No</label>
						<input
							type="text"
							name="participant2RollNo"
							value={formData.participant2RollNo}
							onChange={handleChange}
							className="py-2 px-4 border border-neutral-800/40 rounded-md"
							placeholder="Enter roll number"
						/>
					</div>
				</div>
			</div>
		)}

		{/* College */}
		<div className="flex flex-col gap-2">
			<label className="text-sm text-neutral-800">College Name</label>
			<input
				type="text"
				name="collegeName"
				value={formData.collegeName}
				onChange={handleChange}
				className="py-2 px-4 border border-neutral-800/40 rounded-md"
				placeholder="Enter college name"
			/>
		</div>

		<div className="flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Phone Number</label>
			<input
				type="tel"
				name="phoneNumber"
				value={formData.phoneNumber}
				onChange={handleChange}
				className="py-2 px-4 border border-neutral-800/40 rounded-md"
				placeholder="Enter phone number"
				inputMode="numeric"
				pattern="\d{10}"
				maxLength={10}
				required
			/>
		</div>

		{/* Email */}
		<div className="flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Email</label>
			<input
				type="email"
				name="email"
				value={formData.email}
				onChange={handleChange}
				className="py-2 px-4 border border-neutral-800/40 rounded-md"
				placeholder="Enter email address"
			/>
		</div>
	</>
);

const Step2 = ({
	formData,
	handleChange,
	handlePreviousStep,
	loginMutationIsLoading,
}: {
	formData: any;
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handlePreviousStep: () => void;
	loginMutationIsLoading: boolean;
}) => (
	<div className="flex flex-col gap-5">
		<div className="flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Username</label>
			<input
				type="text"
				name="username"
				value={formData.username}
				onChange={handleChange}
				className="py-3 px-4 border border-neutral-800/40 rounded-md"
				placeholder="Enter username"
			/>
		</div>

		<div className="flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Password</label>
			<input
				type="password"
				name="password"
				value={formData.password}
				onChange={handleChange}
				className="py-3 px-4 border border-neutral-800/40 rounded-md"
				placeholder="Enter password"
			/>
		</div>

		<div className="flex gap-3 mt-4">
			<button
				type="button"
				onClick={handlePreviousStep}
				className="flex-1 py-2 border border-neutral-800/40 text-neutral-800 rounded-md text-lg hover:bg-gray-100 transition-colors"
			>
				Previous
			</button>

			<button
				type="submit"
				disabled={loginMutationIsLoading}
				className="flex-1 py-2 bg-black text-white rounded-md text-lg disabled:opacity-50 hover:bg-gray-800 transition-colors"
			>
				{loginMutationIsLoading ? "Logging in..." : "Continue"}
			</button>
		</div>
	</div>
);

const Login: React.FC = () => {
	const navigate = useNavigate();
	const { login, loginMutationIsLoading } = useUserAuth();

	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState({
		participant1Name: "",
		participant1RollNo: "",
		participant2Name: "",
		participant2RollNo: "",
		collegeName: "",
		phoneNumber: "",
		email: "",
		username: "",
		password: "",
		quizId: "",
	});
	const [quizOptions, setQuizOptions] = useState<
		{ label: string; value: string; teamSize: number }[]
	>([]);
	const [selectedQuizTeamSize, setSelectedQuizTeamSize] = useState(0);

	// Fetch quiz names
	useEffect(() => {
		const fetchQuizNames = async () => {
			try {
				const res = await fetch("/api/quiznames");
				if (!res.ok) throw new Error("Failed to fetch quiz names");
				const data = await res.json();
				console.log(data);
				setQuizOptions(
					data.data.map((quiz: any) => ({
						label: quiz.name,
						value: quiz.id,
						teamSize: quiz.teamSize,
					}))
				);
			} catch (err) {
				console.error("Error fetching quiz names:", err);
			}
		};
		fetchQuizNames();
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleQuizSelect = (value: string) => {
		setFormData((prev) => ({ ...prev, quizId: value }));

		const selectedQuiz = quizOptions.find((quiz) => quiz.value === value);
		const teamSize = selectedQuiz ? selectedQuiz.teamSize : 0;
		setSelectedQuizTeamSize(teamSize);

		// Reset participant 2 if teamSize = 1
		if (teamSize === 1) {
			setFormData((prev) => ({
				...prev,
				participant2Name: "",
				participant2RollNo: "",
			}));
		}
	};

	const handleNextStep = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentStep(2);
	};

	const handlePreviousStep = () => {
		setCurrentStep(1);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login(formData);
			navigate(`/`);
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	const onFormSubmit = (e: React.FormEvent) =>
		currentStep === 1 ? handleNextStep(e) : handleSubmit(e);

	return (
		<div className="w-screen h-dvh flex">
			<div className="w-1/2 h-full bg-white flex items-center justify-center">
				<img
					src={loginImage}
					alt="login-image"
					className="w-full h-full object-cover"
				/>
			</div>

			<div className="w-1/2 h-full border border-neutral-800/40">
				<div className="px-20 py-5 flex flex-col gap-3 justify-center items-center w-full h-full rounded-xl">
					<div className="text-center mb-5 flex flex-col gap-1">
						<h1 className="text-2xl font-bold">QUIZIT</h1>
						<span className="text-base text-neutral-800">
							Powered by RVR&JC Information Technology.
						</span>
					</div>

					<form
						onSubmit={onFormSubmit}
						className="w-full max-w-xl flex flex-col gap-3"
					>
						{currentStep === 1 ? (
							<>
								<Step1
									formData={formData}
									handleChange={handleChange}
									handleQuizSelect={handleQuizSelect}
									quizOptions={quizOptions}
									selectedQuizTeamSize={selectedQuizTeamSize}
								/>
								<div className="flex items-center justify-end pt-2">
									<button
										type="submit"
										className="py-2 px-4 mt-4 bg-black text-white rounded-md text-lg hover:bg-gray-800 transition-colors"
									>
										Continue
									</button>
								</div>
							</>
						) : (
							<Step2
								formData={formData}
								handleChange={handleChange}
								handlePreviousStep={handlePreviousStep}
								loginMutationIsLoading={loginMutationIsLoading}
							/>
						)}
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import loginImage from "../assets/login3.jpg";
import CustomSelect from "../components/CustomSelect";

const Step1 = ({
	formData,
	handleChange,
	handleQuizSelect,
	quizOptions,
	selectedQuizTeamSize,
	errors,
}: {
	formData: any;
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleQuizSelect: (value: string) => void;
	quizOptions: { label: string; value: string; teamSize: number }[];
	selectedQuizTeamSize: number;
	errors: Record<string, string>;
}) => (
	<>
		{/* Quiz selection */}
		<div className="w-full flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Select Quiz</label>
			<CustomSelect
				stylePropsOfSelect="px-2 py-1 text-sm"
				value={formData.quizId}
				onChange={handleQuizSelect}
				options={quizOptions.map((q) => ({ value: q.value, label: q.label }))}
				placeholder="Select a quiz"
			/>
			{errors.quizId && <p className="text-red-500 text-sm">{errors.quizId}</p>}
		</div>

		{/* Participant 1 */}
		<div className="w-full  flex flex-col gap-1">
			<span className="text-sm font-medium">Participant 1</span>
			<div className="w-full flex gap-2">
				<div className="flex-1 flex flex-col gap-2">
					<label className="text-sm text-neutral-800">Name</label>
					<input
						type="text"
						name="participant1Name"
						value={formData.participant1Name}
						onChange={handleChange}
						className="w-full   py-1 px-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
						placeholder="Enter name"
						required
					/>
					{errors.participant1Name && (
						<p className="text-red-500 text-sm">{errors.participant1Name}</p>
					)}
				</div>
				<div className="flex-1 flex flex-col gap-2">
					<label className="text-sm text-neutral-800">Roll No</label>
					<input
						type="text"
						name="participant1RollNo"
						value={formData.participant1RollNo}
						onChange={handleChange}
						className="w-full py-1 px-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
						placeholder="Enter roll number"
						required
					/>
					{errors.participant1RollNo && (
						<p className="text-red-500 text-sm">{errors.participant1RollNo}</p>
					)}
				</div>
			</div>
		</div>

		{/* Participant 2 - Only if teamSize > 1 */}
		{selectedQuizTeamSize > 1 && (
			<div className="w-full flex flex-col gap-1">
				<span className="text-sm font-medium">Participant 2</span>
				<div className="w-full flex gap-3">
					<div className="flex-1 flex flex-col gap-2">
						<label className="text-sm text-neutral-800">Name</label>
						<input
							type="text"
							name="participant2Name"
							value={formData.participant2Name}
							onChange={handleChange}
							className="w-full py-1 px-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
							placeholder="Enter name"
							required
						/>
						{errors.participant2Name && (
							<p className="text-red-500 text-sm">{errors.participant2Name}</p>
						)}
					</div>
					<div className="flex-1 flex flex-col gap-2">
						<label className="text-sm text-neutral-800">Roll No</label>
						<input
							type="text"
							name="participant2RollNo"
							value={formData.participant2RollNo}
							onChange={handleChange}
							className="w-full py-1 px-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
							placeholder="Enter roll number"
							required
						/>
						{errors.participant2RollNo && (
							<p className="text-red-500 text-sm">
								{errors.participant2RollNo}
							</p>
						)}
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
				className="py-1 px-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
				placeholder="Enter college name"
				required
			/>
			{errors.collegeName && (
				<p className="text-red-500 text-sm">{errors.collegeName}</p>
			)}
		</div>

		{/* Phone */}
		<div className="flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Phone Number</label>
			<input
				type="tel"
				name="phoneNumber"
				value={formData.phoneNumber}
				onChange={handleChange}
				className="placeholder:text-sm py-1 px-2 border border-neutral-800/40 rounded-md"
				placeholder="Enter phone number"
				inputMode="numeric"
				pattern="\d{10}"
				maxLength={10}
				required
				
			/>
			{errors.phoneNumber && (
				<p className="text-red-500 text-sm">{errors.phoneNumber}</p>
			)}
		</div>

		{/* Email */}
		<div className="flex flex-col gap-2">
			<label className="text-sm  text-neutral-800">Email</label>
			<input
				type="email"
				name="email"
				value={formData.email}
				onChange={handleChange}
				className="placeholder:text-sm py-1 px-2 border border-neutral-800/40 rounded-md"
				placeholder="Enter email address"
				required
			/>
			{errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
		</div>
	</>
);

const Step2 = ({
	formData,
	handleChange,
	handlePreviousStep,
	loginMutationIsLoading,
	errors,
}: {
	formData: any;
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handlePreviousStep: () => void;
	loginMutationIsLoading: boolean;
	errors: Record<string, string>;
}) => (
	<div className="flex flex-col items-center gap-5">
		{/* Instruction text */}
		<span className="text-base text-neutral-600 text-center">
			Log in with the credentials provided by your coordinators.		
		</span>

		<div className="flex flex-col w-full gap-3">
			{/* Username */}
			<div className="flex flex-col gap-2">
				<label className="text-sm text-neutral-800">Username</label>
				<input
					type="text"
					name="username"
					value={formData.username}
					onChange={handleChange}
					className="placeholder:text-sm py-2 px-4 border border-neutral-800/40 rounded-md focus:outline-none focus:ring-2 focus:ring-black/60"
					placeholder="Enter your username"
					required
				/>
				{errors.username && (
					<p className="text-red-500 text-sm">{errors.username}</p>
				)}
			</div>

			{/* Password */}
			<div className="flex flex-col gap-2">
				<label className="text-sm text-neutral-800">Password</label>
				<input
					type="password"
					name="password"
					value={formData.password}
					onChange={handleChange}
					className="placeholder:text-sm py-2 px-4 border border-neutral-800/40 rounded-md focus:outline-none focus:ring-2 focus:ring-black/60"
					placeholder="Enter your password"
					required
				/>
				{errors.password && (
					<p className="text-red-500 text-sm">{errors.password}</p>
				)}
			</div>
		</div>

		{/* Navigation buttons */}
		<div className="flex w-full gap-3 mt-4">
			<button
				type="button"
				onClick={handlePreviousStep}
				className="px-4 py-2 text-sm border border-neutral-800/40 text-neutral-800 rounded-md hover:bg-gray-100 transition-colors"
			>
				Previous
			</button>

			<button
				type="submit"
				disabled={loginMutationIsLoading}
				className="px-4 py-2 text-sm bg-black text-white rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
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
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Fetch quiz names
	useEffect(() => {
		const fetchQuizNames = async () => {
			try {
				const res = await fetch("/api/quiznames");
				if (!res.ok) throw new Error("Failed to fetch quiz names");
				const data = await res.json();
				setQuizOptions(
					data.data.map((quiz: any) => ({
						label: quiz.name,
						value: quiz.id,
						teamSize: quiz.teamSize,
					}))
				);
			} catch (err) {
				setErrors((prev) => ({
					...prev,
					global: "Could not load quizzes. Please try again later.",
				}));
			}
		};
		fetchQuizNames();
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: "" })); 
	};

	const handleQuizSelect = (value: string) => {
		setFormData((prev) => ({ ...prev, quizId: value }));
		setErrors((prev) => ({ ...prev, quizId: "" }));

		const selectedQuiz = quizOptions.find((quiz) => quiz.value === value);
		const teamSize = selectedQuiz ? selectedQuiz.teamSize : 0;
		setSelectedQuizTeamSize(teamSize);

		if (teamSize === 1) {
			setFormData((prev) => ({
				...prev,
				participant2Name: "",
				participant2RollNo: "",
			}));
		}
	};

	const validateStep1 = () => {
		let newErrors: Record<string, string> = {};
		if (!formData.quizId) newErrors.quizId = "Quiz selection is required.";
		if (!formData.participant1Name)
			newErrors.participant1Name = "Participant 1 name is required.";
		if (!formData.participant1RollNo)
			newErrors.participant1RollNo = "Participant 1 roll number is required.";
		if (selectedQuizTeamSize > 1) {
			if (!formData.participant2Name)
				newErrors.participant2Name = "Participant 2 name is required.";
			if (!formData.participant2RollNo)
				newErrors.participant2RollNo = "Participant 2 roll number is required.";
		}
		if (!formData.collegeName)
			newErrors.collegeName = "College name is required.";
		if (!formData.phoneNumber || formData.phoneNumber.length !== 10)
			newErrors.phoneNumber = "Valid 10-digit phone number is required.";
		if (!formData.email) newErrors.email = "Email is required.";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const validateStep2 = () => {
		let newErrors: Record<string, string> = {};
		if (!formData.username) newErrors.username = "Username is required.";
		if (!formData.password) newErrors.password = "Password is required.";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleNextStep = (e: React.FormEvent) => {
		e.preventDefault();
		if (validateStep1()) setCurrentStep(2);
	};

	const handlePreviousStep = () => {
		setCurrentStep(1);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateStep2()) return;
		try {
			await login(formData);
			navigate(`/`);
		} catch (error: any) {
			setErrors((prev) => ({
				...prev,
				global: error.message || "Login failed. Please try again.",
			}));
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

			<div className="w-1/2 h-full ">
				<div className="px-20 py-5  flex flex-col gap-3  justify-center items-center w-full h-full rounded-xl">
					<div className="text-center  flex flex-col gap-1">
						<h1 className={`font-bold ${currentStep === 2?"text-3xl":"text-2xl"}`}>QUIZ<span className="text-accent">IT</span></h1>
						<span className="text-sm text-neutral-800">
							Powered by RVR&JC Information Technology.
						</span>
					</div>

					<form
						onSubmit={onFormSubmit}
						className="w-full max-w-xl flex flex-col gap-3"
					>
						{errors.global && (
							<p className="text-red-600 text-sm text-center mb-2">
								{errors.global}
							</p>
						)}
						{currentStep === 1 ? (
							<>
								<Step1
									formData={formData}
									handleChange={handleChange}
									handleQuizSelect={handleQuizSelect}
									quizOptions={quizOptions}
									selectedQuizTeamSize={selectedQuizTeamSize}
									errors={errors}
								/>
								<div className="flex items-center justify-start">
									<button
										type="submit"
										className="py-2 px-4  mt-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
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
								errors={errors}
							/>
						)}
					</form>
				</div>
			</div>

		</div>
	);
};

export default Login;

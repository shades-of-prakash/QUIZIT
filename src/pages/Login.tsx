import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import { useQuiz, type QuizSelectOption } from "../context/quizNamesContext";
import CustomSelect from "../components/CustomSelect";
import { Eye, EyeOff } from "lucide-react";

import loginImage200 from "../assets/login_q86a9p_c_scale,w_200.webp";
import loginImage528 from "../assets/login_q86a9p_c_scale,w_528.webp";
import loginImage830 from "../assets/login_q86a9p_c_scale,w_830.webp";
import loginImage1106 from "../assets/login_q86a9p_c_scale,w_1106.webp";
import loginImage1381 from "../assets/login_q86a9p_c_scale,w_1381.webp";
import loginImage1400 from "../assets/login_q86a9p_c_scale,w_1400.webp";

const Step1 = ({
	formData,
	handleChange,
	handleQuizSelect,
	quizSelectOptions,
	selectedQuizTeamSize,
	errors,
}: {
	formData: any;
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleQuizSelect: (value: string) => void;
	quizSelectOptions: QuizSelectOption[];
	selectedQuizTeamSize: number;
	errors: Record<string, string>;
}) => (
	<>
		{/* Quiz selection */}
		<div className="w-full flex flex-col gap-2">
			<label className="text-sm text-neutral-800">Select Quiz</label>
			<CustomSelect
				stylePropsOfSelect="px-2 py-1 text-sm 1.5xl:px-4 1.5xl:py-2"
				value={formData.quizId}
				onChange={handleQuizSelect}
				options={quizSelectOptions}
				placeholder="Select a quiz"
			/>
			{errors.quizId && <p className="text-red-500 text-sm">{errors.quizId}</p>}
		</div>

		{/* Participant 1 */}
		<div className="w-full flex flex-col gap-1">
			<span className="text-sm font-medium">Participant 1</span>
			<div className="w-full flex gap-2">
				<div className="flex-1 flex flex-col gap-2">
					<label className="text-sm text-neutral-800">Name</label>
					<input
						type="text"
						name="participant1Name"
						value={formData.participant1Name}
						onChange={handleChange}
						className="w-full py-1 px-2 1.5xl:px-4 1.5xl:py-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
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
						className="w-full py-1 px-2 1.5xl:px-4 1.5xl:py-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
						placeholder="Enter roll number"
						required
					/>
					{errors.participant1RollNo && (
						<p className="text-red-500 text-sm">{errors.participant1RollNo}</p>
					)}
				</div>
			</div>
		</div>

		{/* Participant 2 */}
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
							className="w-full py-1 px-2 1.5xl:px-4 1.5xl:py-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
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
							className="w-full py-1 px-2 1.5xl:px-4 1.5xl:py-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
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
				className="py-1 px-2 1.5xl:px-4 1.5xl:py-2 placeholder:text-sm border border-neutral-800/40 rounded-md"
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
				className="placeholder:text-sm py-1 px-2 1.5xl:px-4 1.5xl:py-2 border border-neutral-800/40 rounded-md"
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
			<label className="text-sm text-neutral-800">Email</label>
			<input
				type="email"
				name="email"
				value={formData.email}
				onChange={handleChange}
				className="placeholder:text-sm py-1 px-2 1.5xl:px-4 1.5xl:py-2 border border-neutral-800/40 rounded-md"
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
}) => {
	const [showPassword, setShowPassword] = useState(false);

	return (
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
						className="placeholder:text-sm py-2 px-4 border border-neutral-300 rounded-md focus:outline-none focus:border-black"
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
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							name="password"
							value={formData.password}
							onChange={handleChange}
							className="w-full placeholder:text-sm py-2 px-4 pr-10 border border-neutral-300 rounded-md focus:outline-none focus:border-black"
							placeholder="Enter your password"
							required
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-black"
							tabIndex={-1}
						>
							{showPassword ? (
								<EyeOff className="w-5 h-5" />
							) : (
								<Eye className="w-5 h-5" />
							)}
						</button>
					</div>
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
};

// ------------------- MAIN LOGIN -------------------
const Login: React.FC = () => {
	const navigate = useNavigate();
	const { login, loginMutationIsLoading } = useUserAuth();
	const { quizSelectOptions, quizOptions } = useQuiz();

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
	const [errors, setErrors] = useState<Record<string, string>>({});

	const selectedQuizTeamSize =
		quizOptions.find((q) => q.id === formData.quizId)?.teamSize || 0;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: "" }));
	};

	const handleQuizSelect = (value: string) => {
		setFormData((prev) => ({ ...prev, quizId: value }));
		setErrors((prev) => ({ ...prev, quizId: "" }));

		if (selectedQuizTeamSize === 1) {
			setFormData((prev) => ({
				...prev,
				participant2Name: "",
				participant2RollNo: "",
			}));
		}
	};

	return (
		<div className="w-screen h-dvh flex">
			<div className="w-1/2 h-full bg-white overflow-hidden flex items-center justify-center">
				<img
					sizes="(max-width: 1400px) 100vw, 1400px"
					srcSet={`
						${loginImage200} 200w,
						${loginImage528} 528w,
						${loginImage830} 830w,
						${loginImage1106} 1106w,
						${loginImage1381} 1381w,
						${loginImage1400} 1400w`}
					src={loginImage1400}
					alt="user_login_page_image"
					fetchPriority="high"
					className="w-full h-full"
				/>
			</div>

			<div className="w-1/2 h-full">
				<div className="px-20 py-5 flex flex-col gap-3 justify-center items-center w-full h-full rounded-xl">
					<div className="text-center flex flex-col gap-1">
						<h1
							className={`font-bold ${
								currentStep === 2 ? "text-3xl" : "text-2xl"
							}`}
						>
							QUIZ<span className="text-accent">IT</span>
						</h1>
						<span className="text-sm text-neutral-800">
							Powered by RVR&JC Information Technology.
						</span>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (currentStep === 1) {
								setCurrentStep(2);
							} else {
								login(formData).catch((err: any) =>
									setErrors({ global: err.message })
								);
							}
						}}
						className="w-full max-w-xl flex flex-col gap-3"
					>
						{errors.global && (
							<p className="text-red-600 text-sm text-center mb-2">
								{errors.global}
							</p>
						)}

						{currentStep === 1 && (
							<>
								<Step1
									formData={formData}
									handleChange={handleChange}
									handleQuizSelect={handleQuizSelect}
									quizSelectOptions={quizSelectOptions}
									selectedQuizTeamSize={selectedQuizTeamSize}
									errors={errors}
								/>
								<div className="flex items-center justify-start">
									<button
										type="submit"
										className="py-2 px-4 mt-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
									>
										Continue
									</button>
								</div>
							</>
						)}

						{currentStep === 2 && (
							<Step2
								formData={formData}
								handleChange={handleChange}
								handlePreviousStep={() => setCurrentStep(1)}
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

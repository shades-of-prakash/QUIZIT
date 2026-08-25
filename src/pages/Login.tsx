import React, { useState, useEffect } from "react";
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

import meme1 from "../assets/memes/meme1.gif";
import meme2 from "../assets/memes/meme2.gif";

const WAITING_MEMES = [
	{ src: meme1 },
	{ src: meme2 },
];

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

import { Loader2, Loader } from "lucide-react";

const Step2 = ({
	formData,
	handlePreviousStep,
	errors,
	setErrors
}: {
	formData: any;
	handlePreviousStep: () => void;
	errors: Record<string, string>;
	setErrors: (errors: any) => void;
}) => {
	const navigate = useNavigate();
	const [status, setStatus] = useState("PENDING"); // PENDING, APPROVED, REJECTED
	const [randomMeme, setRandomMeme] = useState(WAITING_MEMES[0]);

	useEffect(() => {
		setRandomMeme(WAITING_MEMES[Math.floor(Math.random() * WAITING_MEMES.length)]);
		let intervalId: Timer;

		const startPolling = async () => {
			intervalId = setInterval(async () => {
				try {
					const statusRes = await fetch(
						`/api/approval/status?quizId=${formData.quizId}&participant1RollNo=${formData.participant1RollNo}`
					);
					const statusData = await statusRes.json();

					if (statusData.status === "APPROVED") {
						setStatus("APPROVED");
						clearInterval(intervalId);
						// Give it a second to show the success state then navigate
						setTimeout(() => {
							window.location.href = "/instructions";
						}, 1500);
					} else if (statusData.status === "REVOKED" || statusData.status === "REJECTED") {
						setStatus("REJECTED");
						setErrors({ global: "Your request was declined by the Invigilator." });
						clearInterval(intervalId);
					}
				} catch (pollErr) {
					console.error("Polling error:", pollErr);
				}
			}, 2000);
		};

		startPolling();

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (status === "PENDING" || status === "REQUESTING") {
				e.preventDefault();
			}
		};

		const handleUnload = () => {
			if (status === "PENDING" || status === "REQUESTING") {
				const payload = JSON.stringify({
					quizId: formData.quizId,
					participant1RollNo: formData.participant1RollNo
				});
				const blob = new Blob([payload], { type: 'application/json' });
				navigator.sendBeacon('/api/approval/cancel', blob);
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		window.addEventListener("unload", handleUnload);

		return () => {
			if (intervalId) clearInterval(intervalId);
			window.removeEventListener("beforeunload", handleBeforeUnload);
			window.removeEventListener("unload", handleUnload);
		};
	}, [formData, setErrors, navigate, status]);

	return (
		<div className="flex flex-col items-center gap-6 py-8">
			{status === "REQUESTING" && (
				<>
					<Loader2 className="w-10 h-10 animate-spin text-neutral-500" />
					<span className="text-base text-neutral-600 text-center font-medium">
						Sending request to Admin...
					</span>
				</>
			)}

			{status === "PENDING" && (
				<div className="flex flex-col items-center w-full max-w-md mx-auto gap-6">
					{/* Meme */}
					<div className="flex flex-col items-center gap-3">
						<img
							src={randomMeme?.src}
							alt="Waiting meme"
							className="w-full max-w-[200px] h-auto object-contain rounded-xl shadow-sm"
						/>
					</div>

					{/* Status Header */}
					<div className="flex flex-col items-center mt-2">
						<Loader className="w-5 h-5 text-neutral-400 animate-spin mb-6 mt-4" />
						<h2 className="text-xl text-black font-bold tracking-tight">
							Waiting for Approval
						</h2>
						<p className="text-sm text-neutral-500 text-center mt-2 px-6">
							Please wait while the Invigilator verifies your details and starts your exam.
						</p>

					</div>
				</div>
			)}

			{status === "APPROVED" && (
				<>
					<div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div className="flex flex-col items-center gap-1">
						<span className="text-lg text-green-600 font-semibold">
							Approved!
						</span>
						<span className="text-sm text-neutral-500 text-center">
							Starting exam...
						</span>
					</div>
				</>
			)}

			{status === "REJECTED" && (
				<>
					<div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<div className="flex flex-col items-center gap-1">
						<span className="text-lg text-red-600 font-semibold">
							Request Declined
						</span>
					</div>
					<button
						type="button"
						onClick={handlePreviousStep}
						className="mt-4 px-4 py-2 text-sm border border-neutral-800/40 text-neutral-800 rounded-md hover:bg-gray-100 transition-colors"
					>
						Go Back
					</button>
				</>
			)}
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

	const [isRequesting, setIsRequesting] = useState(false);

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
							className={`font-bold ${currentStep === 2 ? "text-3xl" : "text-2xl"
								}`}
						>
							QUIZ<span className="text-accent">IT</span>
						</h1>
						<span className="text-sm text-neutral-800">
							Powered by RVR&JC Information Technology.
						</span>
					</div>

					<form
						onSubmit={async (e) => {
							e.preventDefault();
							if (currentStep === 1) {
								setIsRequesting(true);
								setErrors({ ...errors, global: "" });
								try {
									const res = await fetch("/api/approval/request", {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify(formData),
									});

									if (!res.ok) {
										const data = await res.json();
										setErrors({ ...errors, global: data.message || "Failed to request approval" });
									} else {
										setCurrentStep(2);
									}
								} catch (err) {
									setErrors({ ...errors, global: "Network error while requesting approval" });
								} finally {
									setIsRequesting(false);
								}
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
										disabled={isRequesting}
										className="py-2 px-4 mt-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-500 flex items-center gap-2"
									>
										{isRequesting ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin" />
												Processing...
											</>
										) : (
											"Continue"
										)}
									</button>
								</div>
							</>
						)}

						{currentStep === 2 && (
							<Step2
								formData={formData}
								handlePreviousStep={() => setCurrentStep(1)}
								errors={errors}
								setErrors={setErrors}
							/>
						)}
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;

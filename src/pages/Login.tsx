import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import loginImage from "../assets/login.png";
import CustomSelect from "../components/CustomSelect";

const Login: React.FC = () => {
	const navigate = useNavigate();

	const { login, loginMutationIsLoading, loginMutationError } = useUserAuth();

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

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleQuizSelect = (option: { label: string; value: string }) => {
		setFormData((prev) => ({ ...prev, quizId: option.value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await login({
				username: formData.username,
				password: formData.password,
				quizId: formData.quizId,
				email: formData.email,
				participant1Name: formData.participant1Name,
				participant1RollNo: formData.participant1RollNo,
				participant2Name: formData.participant2Name,
				participant2RollNo: formData.participant2RollNo,
				collegeName: formData.collegeName,
				phoneNumber: formData.phoneNumber,
			});
			navigate(`/`);
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	return (
		<div className="w-screen h-dvh flex gap-2">
			<div className="w-1/2 h-full bg-white flex items-center justify-center">
				<img src={loginImage} alt="login-image" className="w-full h-full" />
			</div>
			<div className="w-1/2 h-full border border-neutral-800">
				<div className="px-20 py-5 flex flex-col gap-3 justify-center items-center w-full h-full rounded-xl">
					<div>
						<h1 className="text-xl font-bold text-center">QUIZIT</h1>
						<span className="text-sm text-neutral-800">
							Powered by RVR&JC Information Technology.
						</span>
					</div>

					<div className="w-full flex flex-col gap-3">
						{/* Participant 1 Details */}
						<div className="w-full gap-3 flex">
							<div className="w-1/2 flex flex-col gap-2">
								<label className="text-sm text-neutral-800">
									Participant 1 Name
								</label>
								<input
									type="text"
									name="participant1Name"
									required
									value={formData.participant1Name}
									onChange={handleChange}
									className="py-1 px-2 border border-neutral-800 rounded-md"
									placeholder="Enter name"
								/>
							</div>
							<div className="w-1/2 flex flex-col gap-2">
								<label className="text-sm text-neutral-800">
									Participant 1 Roll No
								</label>
								<input
									type="text"
									name="participant1RollNo"
									required
									value={formData.participant1RollNo}
									onChange={handleChange}
									className="py-1 px-2 border border-neutral-800 rounded-md"
									placeholder="Enter roll number"
								/>
							</div>
						</div>

						{/* Participant 2 Details */}
						<div className="w-full gap-3 flex">
							<div className="w-1/2 flex flex-col gap-2">
								<label className="text-sm text-neutral-800">
									Participant 2 Name
								</label>
								<input
									type="text"
									name="participant2Name"
									value={formData.participant2Name}
									onChange={handleChange}
									className="py-1 px-2 border border-neutral-800 rounded-md"
									placeholder="Enter name (optional)"
								/>
							</div>
							<div className="w-1/2 flex flex-col gap-2">
								<label className="text-sm text-neutral-800">
									Participant 2 Roll No
								</label>
								<input
									type="text"
									name="participant2RollNo"
									value={formData.participant2RollNo}
									onChange={handleChange}
									className="py-1 px-2 border border-neutral-800 rounded-md"
									placeholder="Enter roll number (optional)"
								/>
							</div>
						</div>

						{/* College Name */}
						<div className="flex flex-col gap-2">
							<label className="text-sm text-neutral-800">College Name</label>
							<input
								type="text"
								name="collegeName"
								required
								value={formData.collegeName}
								onChange={handleChange}
								className="py-1 px-2 border border-neutral-800 rounded-md"
								placeholder="Enter college name"
							/>
						</div>

						{/* Phone Number */}
						<div className="flex flex-col gap-2">
							<label className="text-sm text-neutral-800">Phone Number</label>
							<input
								type="tel"
								name="phoneNumber"
								required
								value={formData.phoneNumber}
								onChange={handleChange}
								className="py-1 px-2 border border-neutral-800 rounded-md"
								placeholder="Enter phone number"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm text-neutral-800">Email</label>
							<input
								type="email"
								name="email"
								required
								value={formData.email}
								onChange={handleChange}
								className="py-1 px-2 border border-neutral-800 rounded-md"
								placeholder="Enter email address"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm text-neutral-800">Username</label>
							<input
								type="text"
								name="username"
								required
								value={formData.username}
								onChange={handleChange}
								className="py-1 px-2 border border-neutral-800 rounded-md"
								placeholder="Enter username"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm text-neutral-800">Password</label>
							<input
								type="password"
								name="password"
								required
								value={formData.password}
								onChange={handleChange}
								className="py-1 px-2 border border-neutral-800 rounded-md"
								placeholder="Enter password"
							/>
						</div>

						<div className="w-full flex flex-col gap-2">
							<label className="text-sm text-neutral-800">Select Quiz</label>
							<CustomSelect url="/api/quiznames" onChange={handleQuizSelect} />
						</div>

						<button
							type="submit"
							disabled={loginMutationIsLoading}
							onClick={handleSubmit}
							className="py-1 mt-4 xl:mt-2 bg-black text-white rounded-md text-xl disabled:opacity-50"
						>
							{loginMutationIsLoading ? "Logging in..." : "Continue"}
						</button>

						{loginMutationError && (
							<p className="text-red-500 mt-2">
								{loginMutationError.message || "Login failed"}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
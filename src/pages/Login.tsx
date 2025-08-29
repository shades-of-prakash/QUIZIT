import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import loginImage from "../assets/login.png";
import CustomSelect from "../components/CustomSelect";

const Login: React.FC = () => {
	const navigate = useNavigate();

	const { login, loginMutationIsLoading, loginMutationError } = useUserAuth();

	const [formData, setFormData] = useState({
		participant1: "",
		participant2: "",
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
				participant1: formData.participant1,
				participant2: formData.participant2,
			});
			navigate(`/`);
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	return (
		<div className="w-screen h-dvh bg-white flex">
			<div className="w-1/2 h-full flex items-center justify-center">
				<img src={loginImage} alt="login-image" />
			</div>
			<div className="w-1/2 h-full p-10">
				<div className="p-5 xl:py-5 xl:px-8 flex flex-col gap-2 items-center w-full h-full border border-black rounded-xl">
					<h1 className="text-4xl lg:text-xl font-bold text-center">QUIZIT</h1>
					<span className="text-sm text-neutral-800">
						Powered by RVR&JC Information Technology.
					</span>

					<form
						onSubmit={handleSubmit}
						className="mt-4 lg:gap-3 xl:gap-4 w-full flex flex-col"
					>
						<div className="w-full gap-1 flex">
							<div className="w-1/2 flex flex-col gap-2">
								<label className="text-sm text-neutral-800">
									Participant 1
								</label>
								<input
									type="text"
									name="participant1"
									required
									value={formData.participant1}
									onChange={handleChange}
									className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
								/>
							</div>
							<div className="w-1/2 flex flex-col gap-2">
								<label className="text-sm text-neutral-800">
									Participant 2
								</label>
								<input
									type="text"
									name="participant2"
									required
									value={formData.participant2}
									onChange={handleChange}
									className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<label className="text-sm text-neutral-800">Email</label>
							<input
								type="email"
								name="email"
								required
								value={formData.email}
								onChange={handleChange}
								className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
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
								className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
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
								className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
							/>
						</div>

						<div className="w-full flex flex-col gap-2">
							<label className="text-sm text-neutral-800">Select Quiz</label>
							<CustomSelect url="/api/quiznames" onChange={handleQuizSelect} />
						</div>

						<button
							type="submit"
							disabled={loginMutationIsLoading}
							className="lg:p-2 xl:p-3 mt-4 bg-black text-white rounded-md text-xl disabled:opacity-50"
						>
							{loginMutationIsLoading ? "Logging in..." : "Continue"}
						</button>

						{loginMutationError && (
							<p className="text-red-500 mt-2">
								{loginMutationError.message || "Login failed"}
							</p>
						)}
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;

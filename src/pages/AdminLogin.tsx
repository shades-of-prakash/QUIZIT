import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";

const AdminLogin = () => {
	const { login, loginMutationIsLoading, loginMutationError, isLoggedIn } =
		useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (isLoggedIn) {
			navigate("/admin");
		}
	}, [isLoggedIn, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login({ username, password });
		} catch {}
	};

	return (
		<div className="w-screen h-dvh relative flex items-center justify-center bg-[#f8f8ff]">
			{/* background */}
			<div className="z-0 absolute w-full h-full opacity-60">
				<div className="min-h-screen w-full bg-[#f8f8ff] relative">
					<div
						className="absolute inset-0 z-0"
						style={{
							backgroundImage: `
								linear-gradient(to right, #e2e8f0 1px, transparent 1px),
								linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
							`,
							backgroundSize: "20px 30px",
							WebkitMaskImage:
								"radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
							maskImage:
								"radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
						}}
					/>
				</div>
			</div>

			{/* login card */}
			<div className="z-10 border border-neutral-800/20 w-[450px] h-auto py-10 bg-[#f8f8ff] rounded-xl flex flex-col items-center justify-center">
				<h1 className="font-bold text-3xl">
					QUIZ<span className="text-accent">IT</span>
				</h1>
				<div className="w-full px-10 text-center mt-4">
					<p className="text-neutral-700 text-sm">
						Enter your credentials to securely access the control panel and
						manage your system.
					</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="w-full flex flex-col px-10 gap-4 mt-6"
				>
					{/* username */}
					<div className="flex flex-col gap-1">
						<label htmlFor="username" className="text-neutral-500">
							Username
						</label>
						<input
							type="text"
							id="username"
							className="px-4 py-3 border border-neutral-800/40 bg-transparent rounded-md"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							disabled={loginMutationIsLoading}
							autoComplete="username"
						/>
					</div>

					{/* password with toggle */}
					<div className="flex flex-col gap-1">
						<label htmlFor="password" className="text-neutral-500">
							Password
						</label>
						<div className="relative">
							<input
								type={showPassword ? "text" : "password"}
								id="password"
								className="w-full px-4 py-3 border border-neutral-800/40 bg-transparent rounded-md pr-10"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={loginMutationIsLoading}
								autoComplete="current-password"
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
					</div>

					{/* login button */}
					<div className="flex w-full mt-4">
						<button
							type="submit"
							className="w-full px-4 py-3 bg-black hover:bg-black/90 text-white rounded-md font-bold"
							disabled={loginMutationIsLoading}
						>
							{loginMutationIsLoading ? "Logging in..." : "Login"}
						</button>
					</div>

					{/* error */}
					{loginMutationError && (
						<p className="text-red-600 text-center">
							{loginMutationError.message}
						</p>
					)}
				</form>
			</div>
		</div>
	);
};

export default AdminLogin;

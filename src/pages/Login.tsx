import React from "react";
import loginImage from "../assets/login.png";
import CustomSelect from "../components/CustomSelect";
const Login = () => {
	const quizzes = [
		{ value: "math", label: "Math Quiz" },
		{ value: "science", label: "Science Quiz" },
		{ value: "history", label: "History Quiz" },
		{ value: "coding", label: "Coding Quiz" },
		{ value: "coding", label: "Coding Quiz" },

	  ];
	return (
		<div className="w-screen h-dvh bg-white flex ">
			<div className="w-1/2 h-full flex items-center justify-center">
				<img src={loginImage} alt="login-image" />
			</div>
			<div className="w-1/2 h-full p-10" >
				<div className="p-5 xl:p-12 flex flex-col gap-2 items-center w-full h-full border border-black rounded-xl">
					<h1 className="text-4xl  lg:text-xl font-bold lg:mt-4 xl:mt-8 text-center">QUIZIT</h1>
					<span className="text-sm lg:text-xs text-neutral-800">Powered by RVR&JC Information Technology.</span>
					<form action="" className="mt-4 lg:gap-3  xl:gap-4 w-full flex flex-col">
						<div className="w-full gap-1 flex">
							<div className="w-1/2 flex flex-col gap-2">
								<label
									htmlFor="participant1"
									className="text-sm text-neutral-800"
								>
									Participant 1
								</label>
								<input
									type="text"
									required
									className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
								/>
							</div>
							<div className="w-1/2 flex flex-col gap-2">
								<label htmlFor="" className="text-sm text-neutral-800">
									Participant 2
								</label>
								<input
									type="text"
									required
									className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="Username" className="text-sm text-neutral-800">
								Username
							</label>
							<input
								type="text"
								required
								className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="Username" className="text-sm text-neutral-800">
								Password
							</label>
							<input
								type="password"
								required
								className="lg:p-2 xl:p-3 border border-neutral-800 rounded-md"
							/>
						</div>
						<div className="w-full flex flex-col gap-2">
							<label htmlFor="Username" className="text-sm text-neutral-800">
								Select Quiz
							</label>
							<CustomSelect options={quizzes} onChange={(option) => {}} />
						</div>
						<button className="lg:p-2 xl:p-3 mt-4 bg-black text-white rounded-md text-xl">
							Continue
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;

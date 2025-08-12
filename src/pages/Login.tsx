import React from "react";
import loginImage from "../assets/login.png";
const Login = () => {
	return (
		<div className="w-screen h-dvh bg-white flex ">
			<div className="w-1/2 h-full flex items-center justify-center">
				<img src={loginImage} alt="login-image" />
			</div>
			<div className="w-1/2 h-full  p-10">
				<div className="p-12 flex flex-col gap-2  items-center w-full h-full border border-black rounded-xl">
					<h1 className="text-4xl font-bold">QUIZIT</h1>
					<span>Powered by RVR&JC Information Technology.</span>
					<form action="" className="mt-4 gap-4 w-full flex flex-col">
						<div className="flex flex-col gap-2">
							<label
								htmlFor="participant1"
								className="text-sm text-neutral-800"
							>
								Participant 1
							</label>
							<input
								type="text"
								placeholder="Y22IT058"
								className="p-3 border border-neutral-800 rounded-md"
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="" className="text-sm text-neutral-800">
								Participant 2
							</label>
							<input
								type="text"
								placeholder="Y22IT051"
								className="p-3 border border-neutral-800 rounded-md"
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="Username" className="text-sm text-neutral-800">
								Username
							</label>
							<input
								type="text"
								className="p-3 border border-neutral-800 rounded-md"
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="Username" className="text-sm text-neutral-800">
								Password
							</label>
							<input
								type="password"
								className="p-3 border border-neutral-800 rounded-md"
							/>
						</div>
						<button className="p-3 mt-4 bg-black text-white rounded-md text-xl">
							Continue
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;

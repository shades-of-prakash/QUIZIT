import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const Submission = () => {
	const navigate = useNavigate();
	const { logout } = useUserAuth();

	useEffect(() => {
		if (document.fullscreenElement) {
			document.exitFullscreen().catch((err) => {
				console.warn("Error exiting fullscreen:", err);
			});
		}

		const timer = setTimeout(async () => {
			await logout();
		}, 5000);

		return () => clearTimeout(timer);
	}, [logout]);

	return (
		<div className="flex flex-col items-center justify-center h-screen text-center px-4">
			<div className="w-48 h-48 mb-2">
				<DotLottieReact
					src="https://lottie.host/3f414451-aa82-429b-af3c-84b98ff6017d/V1zRuzKXsM.lottie"
					autoplay
					loop={true}
					style={{ width: "100%", height: "100%" }}
				/>
			</div>

			<h1 className="text-3xl font-semibold mb-4">
				Test Successfully Submitted!
			</h1>
			<p className="text-xl mb-6">Your results have been recorded.</p>
			<p className="text-sm text-gray-400">
				(You will be logged out in 5 seconds)
			</p>
		</div>
	);
};

export default Submission;

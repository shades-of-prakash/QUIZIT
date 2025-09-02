import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";

const Test = () => {
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
		}, 10000);

		return () => clearTimeout(timer);
	}, [logout]);

	return (
		<div className="flex flex-col items-center justify-center h-screen text-center">
			<h1 className="text-2xl font-bold">🎉 Test Completed!</h1>
			<p className="mt-2 text-lg">You will be logged out in 10 seconds...</p>
			<p className="mt-1 text-gray-500">(Fullscreen exited)</p>
		</div>
	);
};

export default Test;

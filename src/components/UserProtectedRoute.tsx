import { Navigate, Outlet, useLocation } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import { useEffect, useState } from "react";

const UserProtectedRoute = () => {
	const { user, isLoading } = useUserAuth();
	const location = useLocation();

	const [isChecking, setIsChecking] = useState(true);
	const [completed, setCompleted] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const { logout } = useUserAuth();

	useEffect(() => {
		const verifySession = async () => {
			if (!user) {
				setCompleted(false);
				setIsChecking(false);
				return;
			}

			try {
				const res = await fetch("/api/check-session", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: user._id, quizId: user.quizId }),
				});

				if (res.ok) {
					const data = await res.json();
					setCompleted(!!data.completed);
				} else {
					setCompleted(false);
				}
			} catch (err) {
				console.error("Session check failed", err);
				setCompleted(false);
			} finally {
				setIsChecking(false);
			}
		};

		verifySession();
	}, [user, location.pathname]);

	useEffect(() => {
		if (!user || completed) return;

		const checkApprovalStatus = async () => {
			try {
				const res = await fetch(`/api/approval/status?quizId=${user.quizId}&participant1RollNo=${user.participant1RollNo}`);
				const data = await res.json();
				
				if (data.status === "PAUSED") {
					setIsPaused(true);
				} else if (data.status === "REVOKED" || data.status === "NOT_FOUND") {
					await logout();
					window.location.href = "/";
				} else {
					setIsPaused(false);
				}
			} catch (err) {
				console.error("Failed to check approval status");
			}
		};

		checkApprovalStatus();
		const interval = setInterval(checkApprovalStatus, 3000);
		return () => clearInterval(interval);
	}, [user, completed, logout]);

	if (isLoading || isChecking) {
		return (
			<div className="w-full flex items-center justify-center h-screen">
				<div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/" replace />;
	}

	if (
		(location.pathname === "/quiz" || location.pathname === "/instructions") &&
		completed
	) {
		return <Navigate to="/submission" replace />;
	}

	if (location.pathname === "/submission" && !completed) {
		return <Navigate to="/quiz" replace />;
	}

	return (
		<>
			<Outlet context={{ isPaused }} />
			{isPaused && (
				<div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
					<svg className="w-16 h-16 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Session Paused</h1>
					<p className="text-gray-600 text-lg text-center max-w-md">Your exam has been paused by the Invigilator. Please wait for them to resume your session.</p>
				</div>
			)}
		</>
	);
};

export default UserProtectedRoute;

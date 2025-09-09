import { Navigate, Outlet, useLocation } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import { useEffect, useState } from "react";

const UserProtectedRoute = () => {
	const { user, isLoading } = useUserAuth();
	const location = useLocation();

	const [isChecking, setIsChecking] = useState(true);
	const [completed, setCompleted] = useState(false);

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
					console.log("check-session data", data);
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

	return <Outlet />;
};

export default UserProtectedRoute;

import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/authContext";

const ProtectedRoute = () => {
	const { isLoading, isLoggedIn } = useAuth();

	if (isLoading) {
		return (
			<div className="w-screen h-screen flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
			</div>
		);
	}

	if (!isLoggedIn) {
		return <Navigate to="/admin-login" replace />;
	}

	return <Outlet />;
};

export default ProtectedRoute;

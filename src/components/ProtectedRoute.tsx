import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/authContext";

const ProtectedRoute = () => {
	const { isLoading, isLoggedIn } = useAuth();

	if (isLoading) {
		return (
			<div className="w-screen h-screen flex items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!isLoggedIn) {
		return <Navigate to="/admin-login" replace />;
	}

	return <Outlet />;
};

export default ProtectedRoute;

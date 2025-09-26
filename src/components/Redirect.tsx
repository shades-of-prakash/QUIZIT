import { Navigate, useNavigate } from "react-router";
import { useUserAuth } from "../context/userAuthContext";
import React from "react";

const Redirect = ({ children }: { children: React.ReactNode }) => {
	const { user, isLoading } = useUserAuth();
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-500"></div>
			</div>
		);
	}

	if (user) {
		return <Navigate to="/instructions" replace />;
	}

	return <>{children}</>;
};

export default Redirect;

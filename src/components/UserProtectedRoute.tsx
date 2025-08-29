import { Navigate, Outlet } from "react-router";
import { useUserAuth } from "../context/userAuthContext";

const UserProtectedRoute = () => {
	const { user, isLoading } = useUserAuth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-lg font-semibold">Loading...</p>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/user-login" replace />;
	}
	return <Outlet />;
};

export default UserProtectedRoute;

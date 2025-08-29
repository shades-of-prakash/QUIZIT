import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./pages/Login";
import Quiz from "./components/Quiz";
import AdminLogin from "./pages/AdminLogin";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./components/ProtectedRoute";
// import Dashboard from "./components/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import Results from "./components/Results";
import Createquiz from "./components/Createquiz";
import { Toaster } from "sonner";
import SingleQuizHandler from "./components/SingleQuizHandler";
import { Navigate } from "react-router";
import { UserAuthProvider } from "./context/userAuthContext";
import UserProtectedRoute from "./components/UserProtectedRoute";
import Redirect from "./components/Redirect";
const queryClient = new QueryClient();
const Noise = () => {
	return (
		<div className="w-screen h-screen">
			<div className="h-full border border-green-600 bg-[#111827]">
				<svg id="noice" className="h-full w-full">
					<filter id="noise-filter">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.92"
							numOctaves="4"
							stitchTiles="stitch"
						></feTurbulence>
						<feColorMatrix type="saturate" values="0"></feColorMatrix>
						<feComponentTransfer>
							<feFuncR type="linear" slope="0.64"></feFuncR>
							<feFuncG type="linear" slope="0.64"></feFuncG>
							<feFuncB type="linear" slope="0.64"></feFuncB>
							<feFuncA type="linear" slope="0.56"></feFuncA>
						</feComponentTransfer>
						<feComponentTransfer>
							<feFuncR type="linear" slope="1.47" intercept="-0.23" />
							<feFuncG type="linear" slope="1.47" intercept="-0.23" />
							<feFuncB type="linear" slope="1.47" intercept="-0.23" />
						</feComponentTransfer>
					</filter>
					<rect width="100%" height="100%" filter="url(#noise-filter)"></rect>
				</svg>
			</div>
		</div>
	);
};
export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<UserAuthProvider>
					<BrowserRouter>
						<Toaster position="top-center" />
						<Routes>
							<Route
								path="/user-login"
								element={
									<Redirect>
										<Login />
									</Redirect>
								}
							/>

							<Route element={<UserProtectedRoute />}>
								<Route path="/" element={<Quiz />} />
							</Route>
							<Route path="/admin-login" element={<AdminLogin />} />

							<Route element={<ProtectedRoute />}>
								<Route path="/admin" element={<DashboardLayout />}>
									<Route index element={<Navigate to="Createquiz" replace />} />
									<Route path="results" element={<Results />} />
									<Route path="Createquiz" element={<Createquiz />} />
									<Route
										path="Createquiz/:id"
										element={<SingleQuizHandler />}
									/>
								</Route>
							</Route>
						</Routes>
					</BrowserRouter>
				</UserAuthProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;

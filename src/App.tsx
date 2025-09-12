import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";

// Context providers
import { AuthProvider } from "./context/authContext";
import { UserAuthProvider } from "./context/userAuthContext";
import { QuizProvider } from "./context/quizNamesContext";

//loader
import Loader from "./components/Loader";

const Login = lazy(() => import("./pages/Login"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Quiz = lazy(() => import("./components/Quiz"));
const Instructions = lazy(() => import("./components/Instructions"));
const Submission = lazy(() => import("./components/Submission"));
const Results = lazy(() => import("./components/Results"));
const Createquiz = lazy(() => import("./components/Createquiz"));
const SingleQuizHandler = lazy(() => import("./components/SingleQuizHandler"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const UserProtectedRoute = lazy(
	() => import("./components/UserProtectedRoute")
);
const Redirect = lazy(() => import("./components/Redirect"));

const queryClient = new QueryClient();

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<UserAuthProvider>
					<QuizProvider>
						<BrowserRouter>
							<Toaster position="top-center" richColors />
							<Suspense fallback={<Loader />}>
								<Routes>
									<Route element={<UserProtectedRoute />}>
										<Route path="/instructions" element={<Instructions />} />
										<Route path="/quiz" element={<Quiz />} />
										<Route path="/submission" element={<Submission />} />
									</Route>

									<Route
										path="/"
										element={
											<Redirect>
												<Login />
											</Redirect>
										}
									/>

									{/* Admin routes */}
									<Route path="/admin-login" element={<AdminLogin />} />
									<Route element={<ProtectedRoute />}>
										<Route path="/admin" element={<DashboardLayout />}>
											<Route
												index
												element={<Navigate to="Createquiz" replace />}
											/>
											<Route path="results" element={<Results />} />
											<Route path="Createquiz" element={<Createquiz />} />
											<Route
												path="Createquiz/:id"
												element={<SingleQuizHandler />}
											/>
										</Route>
									</Route>
								</Routes>
							</Suspense>
						</BrowserRouter>
					</QuizProvider>
				</UserAuthProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;

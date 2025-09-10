import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./pages/Login";
import Quiz from "./components/Quiz";
import AdminLogin from "./pages/AdminLogin";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Results from "./components/Results";
import Createquiz from "./components/Createquiz";
import { Toaster } from "sonner";
import SingleQuizHandler from "./components/SingleQuizHandler";
import { Navigate } from "react-router";
import { UserAuthProvider } from "./context/userAuthContext";
import UserProtectedRoute from "./components/UserProtectedRoute";
import Instructions from "./components/Instructions";
import Redirect from "./components/Redirect";
import Submission from "./components/Submission";
import { QuizProvider } from "./context/quizNamesContext";

const queryClient = new QueryClient();

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<UserAuthProvider>
					<QuizProvider>
						<BrowserRouter>
							<Toaster position="top-center" richColors />
							<Routes>
								<Route element={<UserProtectedRoute />}>
									<Route path="/instructions" element={<Instructions />} />
								</Route>

								<Route
									path="/"
									element={
										<Redirect>
											<Login />
										</Redirect>
									}
								/>

								<Route element={<UserProtectedRoute />}>
									<Route path="/quiz" element={<Quiz />} />
									<Route path="/submission" element={<Submission />} />
								</Route>

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
						</BrowserRouter>
					</QuizProvider>
				</UserAuthProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;

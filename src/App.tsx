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
const queryClient = new QueryClient();

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<Login />} />
						<Route path="/quiz" element={<Quiz />} />
						<Route path="/admin-login" element={<AdminLogin />} />

						<Route element={<ProtectedRoute />}>
							<Route path="/admin" element={<DashboardLayout />}>
								<Route index element={<Createquiz />} />
								<Route path="results" element={<Results />} />
								<Route path="Createquiz" element={<Createquiz />} />
							</Route>
						</Route>
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;

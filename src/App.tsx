import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./pages/Login";
import Quiz from "./components/Quiz";
import AdminLogin from "./pages/AdminLogin";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contest/authContest";
import ProtectedRoute from "./components/ProtectedRoute";
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
							<Route path="/admin" element={<div>Admin After login</div>} />
						</Route>
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;

import React, { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
type User = {
	id: string;
	name: string;
	email: string;
};

type LoginCredentials = {
	username: string;
	password: string;
};

type AuthContextType = {
	user: User | null;
	isLoading: boolean;
	isLoggedIn: boolean;
	login: (credentials: LoginCredentials) => Promise<void>;
	loginMutationIsLoading: boolean;
	loginMutationError: Error | null;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API call to fetch the current user (cookie-based)
async function fetchUserApi(): Promise<User | null> {
	const res = await fetch("/api/user", {
		method: "GET",
		credentials: "include", // needed if you're using cookies & cross-origin
	});

	if (res.status === 401) {
		return null;
	}

	if (!res.ok) {
		throw new Error("Failed to fetch user");
	}

	const response = await res.json(); // ✅ await here
	return response;
}

// API call to log in
// console.log(process.env.API_URL);
async function loginApi(credentials: LoginCredentials): Promise<User> {
	const res = await fetch(`/api/login`, {
		method: "POST",
		credentials: "include", // send & store cookies
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(credentials),
	});

	const json = await res.json();
	if (!res.ok) {
		throw new Error(json.message || "Login failed");
	}

	return json;
}

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
	// Query to fetch the logged-in user
	const {
		data: userData,
		isLoading,
		refetch,
	} = useQuery<User | null, Error>({
		queryKey: ["currentUser"],
		queryFn: fetchUserApi,
		retry: false,
	});

	// Mutation to log in
	const {
		mutateAsync: loginMutation,
		isPending: loginMutationIsLoading,
		error: loginMutationError,
	} = useMutation<User, Error, LoginCredentials>({
		mutationFn: loginApi,
		onSuccess: async () => {
			await refetch();
		},
	});

	const login = async (credentials: LoginCredentials) => {
		await loginMutation(credentials);
	};

	const authContextValue: AuthContextType = {
		user: userData ?? null,
		isLoading,
		isLoggedIn: !!userData,
		login,
		loginMutationIsLoading,
		loginMutationError: loginMutationError || null,
	};

	return (
		<AuthContext.Provider value={authContextValue}>
			{children}
		</AuthContext.Provider>
	);
};

// Hook
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserApi(): Promise<User | null> {
	const res = await fetch("/api/user", {
		method: "GET",
		credentials: "include",
	});

	if (res.status === 401) {
		return null;
	}

	if (!res.ok) {
		throw new Error("Failed to fetch user");
	}

	const response = await res.json();
	return response;
}

async function loginApi(credentials: LoginCredentials): Promise<User> {
	const res = await fetch(`/api/login`, {
		method: "POST",
		credentials: "include",
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
	const {
		data: userData,
		isLoading,
		refetch,
	} = useQuery<User | null, Error>({
		queryKey: ["currentUser"],
		queryFn: fetchUserApi,
		retry: false,
	});

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

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

import React, {
	createContext,
	useContext,
	type ReactNode,
	useEffect,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

type User = {
	_id: string;
	username: string;
	quizId: string;
	quizDuration: string;
	email: string;
	participant1Name?: string;
	participant1RollNo?: string;
	participant2Name?: string;
	participant2RollNo?: string;
	collegeName?: string;
	phoneNumber?: string;
};

type LoginCredentials = {
	username: string;
	password: string;
	quizId: string;
	email: string;
	participant1Name: string;
	participant1RollNo: string;
	participant2Name?: string;
	participant2RollNo?: string;
	collegeName: string;
	phoneNumber: string;
};

type UserAuthContextType = {
	user: User | null;
	isLoading: boolean;
	isLoggedIn: boolean;
	login: (credentials: LoginCredentials) => Promise<void>;
	loginMutationIsLoading: boolean;
	loginMutationError: Error | null;
	logout: () => Promise<void>;
};

// Create context
const UserAuthContext = createContext<UserAuthContextType | undefined>(
	undefined
);

async function fetchUserApi(): Promise<User | null> {
	const res = await fetch("/api/me", {
		method: "GET",
		credentials: "include",
	});

	if (!res.ok) {
		throw new Error("Failed to fetch user");
	}

	const { user } = await res.json();
	return user ?? null;
}

async function loginApi(credentials: LoginCredentials): Promise<User> {
	const res = await fetch(`/api/userlogin`, {
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

	return json.data;
}

async function logoutApi(): Promise<void> {
	await fetch(`/api/userlogout`, {
		method: "POST",
		credentials: "include",
	});
}

// Provider
export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
	const {
		data: userData,
		isLoading,
		refetch,
	} = useQuery<User | null, Error>({
		queryKey: ["currentquizUser"],
		queryFn: fetchUserApi,
		retry: false,
 	enabled: true,
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

	const { mutateAsync: logoutMutation } = useMutation<void, Error>({
		mutationFn: logoutApi,
		onSuccess: async () => {
			await refetch();
		},
	});

	const login = async (credentials: LoginCredentials) => {
		await loginMutation(credentials);
	};

	const logout = async () => {
		await logoutMutation();
	};

	const authContextValue: UserAuthContextType = {
		user: userData ?? null,
		isLoading,
		isLoggedIn: !!userData,
		login,
		loginMutationIsLoading,
		loginMutationError: loginMutationError || null,
		logout,
	};

	return (
		<UserAuthContext.Provider value={authContextValue}>
			{children}
		</UserAuthContext.Provider>
	);
};

export const useUserAuth = () => {
	const context = useContext(UserAuthContext);
	if (!context) {
		throw new Error("useUserAuth must be used within a UserAuthProvider");
	}
	return context;
};

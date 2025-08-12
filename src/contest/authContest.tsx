import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
type User = {
	id: string;
	name: string;
	email: string;
};

type AuthContextType = {
	user: User | null;
	isLoading: boolean;
	isLoggedIn: boolean;
	login: (credentials: { username: string; password: string }) => Promise<void>;
	loginMutationIsLoading: boolean;
	loginMutationError: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserApi(): Promise<User | null> {
	const res = await fetch("/api/user", {
		method: "GET",
		credentials: "include",
	});

	if (res.status === 401) return null;
	if (!res.ok) {
		throw new Error("Failed to fetch user");
	}

	return res.json();
}

// Login user
async function loginApi(credentials: {
	username: string;
	password: string;
}): Promise<User> {
	const res = await fetch("/api/login", {
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

const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loginMutationIsLoading, setLoginMutationIsLoading] = useState(false);
	const [loginMutationError, setLoginMutationError] = useState<Error | null>(
		null
	);

	// Load current user on mount
	useEffect(() => {
		let isMounted = true;

		const loadUser = async () => {
			try {
				setIsLoading(true);
				const currentUser = await fetchUserApi();
				if (isMounted) {
					setUser(currentUser);
				}
			} catch (error) {
				console.error(error);
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};

		loadUser();
		return () => {
			isMounted = false;
		};
	}, []);

	// Login function
	const login = async (credentials: { username: string; password: string }) => {
		try {
			setLoginMutationIsLoading(true);
			setLoginMutationError(null);
			const loggedInUser = await loginApi(credentials);
			setUser(loggedInUser);
		} catch (error) {
			setLoginMutationError(error as Error);
		} finally {
			setLoginMutationIsLoading(false);
		}
	};

	const authContextValue: AuthContextType = {
		user,
		isLoading,
		isLoggedIn: !!user,
		login,
		loginMutationIsLoading,
		loginMutationError,
	};

	return (
		<AuthContext.Provider value={authContextValue}>
			{children}
		</AuthContext.Provider>
	);
};

const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export { AuthProvider, useAuth };

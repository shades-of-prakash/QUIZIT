import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginMutationIsLoading: boolean;
  loginMutationError: Error | null;
};

type LoginCredentials = {
  username: string;
  password: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserApi(): Promise<User | null> {
  try {
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

    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

async function loginApi(credentials: LoginCredentials): Promise<User> {
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

  return json;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useQuery<User | null, Error>({
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
      const refetched = await refetch();
      setUser(refetched.data ?? null);
    },
  });

  const login = async (credentials: LoginCredentials) => {
    try {
      await loginMutation(credentials);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (data !== undefined) {
      setUser(data);
    }
  }, [data]);

  const authContextValue: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    loginMutationIsLoading,
    loginMutationError: loginMutationError || null,
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

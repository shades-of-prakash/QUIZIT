import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext"; // ensure path is correct
import { useNavigate } from "react-router";  // react-router-dom for v6+

const AdminLogin = () => {
  const {
    login,
    loginMutationIsLoading,
    loginMutationError,
    isLoggedIn,
  } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
	console.log("isLoggedin",isLoggedIn)
    if (isLoggedIn) {
      navigate("/admin");
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
    } catch {
    }
  };

  return (
    <div className="w-screen h-dvh flex items-center justify-center bg-white">
      <div className="box w-[450px] h-[600px] bg-white rounded-xl flex flex-col items-center justify-center">
        <h1 className="font-semibold text-3xl">
          QUIZ<span className="text-accent">IT</span>
        </h1>
        <div className="w-full px-10 text-center mt-4">
          <p className="text-neutral-700">
            Enter your credentials to securely access the control panel and
            manage your system.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col px-10 gap-4 mt-6"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-neutral-500">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="p-3 border border-neutral-800/50 rounded-md"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loginMutationIsLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-neutral-500">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="p-3 border border-neutral-800/50 rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loginMutationIsLoading}
            />
          </div>
          <div className="w-full p-10">
            <button
              type="submit"
              className="w-full p-3 bg-accent rounded-md font-bold"
              disabled={loginMutationIsLoading}
            >
              {loginMutationIsLoading ? "Logging in..." : "Login"}
            </button>
          </div>
          {loginMutationError && (
            <p className="text-red-600 text-center">
              {loginMutationError.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

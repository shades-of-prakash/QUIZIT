import { serve } from "bun";
import index from "./index.html";
import { connectDB } from "./api/db";
import { Routes } from "./api/routes/routes";
import { authRoutes } from "./api/routes/authRoutes";
async function startServer() {
	await connectDB();

	const server = serve({
		port: 4000,
		routes: {
			"/*": index,
			...Routes,
			...authRoutes,
		},
		development: process.env.NODE_ENV !== "production" && {
			hmr: true,
			console: true,
		},
	});

	console.log(`🚀 Server running at ${server.url}`);
}

startServer();

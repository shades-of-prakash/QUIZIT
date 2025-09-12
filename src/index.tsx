import { serve, file } from "bun";
import { connectDB } from "./api/db";
import { authRoutes } from "./api/routes/authRoutes";
import { quizRoutes } from "./api/routes/quizRoutes";
import { userRoutes } from "./api/routes/userRoutes";
import index from "./index.html";

async function startServer() {
	await connectDB();

	const server = serve({
		port: 4000,
		hostname: "0.0.0.0",
		routes: {
			"/*": index,
			...authRoutes,
			...quizRoutes,
			...userRoutes,
		},
		development: process.env.NODE_ENV !== "production" && {
			hmr: true,
			console: true,
		},
	});

	console.log(`🚀 Server running at ${server.url}`);
}

startServer();

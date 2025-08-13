import { serve } from "bun";
import index from "./index.html";
import { connectDB } from "./api/db";
import { authRoutes } from "./api/routes/authRoutes";
import { quizRoutes } from "./api/routes/quizRoutes";
async function startServer() {
	await connectDB();

	const server = serve({
		port: 4000,
		routes: {
			"/*": index,
			...authRoutes,
			...quizRoutes,
		},
		development: process.env.NODE_ENV !== "production" && {
			hmr: true,
			console: true,
		},
	});

	console.log(`🚀 Server running at ${server.url}`);
}

startServer();

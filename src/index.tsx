import { serve } from "bun";
import index from "./index.html";
import { authRoutes } from "./api/routes/authRoutes";
import { quizRoutes } from "./api/routes/quizRoutes";
import { userRoutes } from "./api/routes/userRoutes";
import { connectDB } from "./api/db";

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
	});

	console.log(`🚀 Server running at ${server.url}`);
}

startServer();

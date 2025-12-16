import { serve } from "bun";
import index from "./index.html";
import { authRoutes } from "./api/routes/authRoutes";
import { quizRoutes } from "./api/routes/quizRoutes";
import { userRoutes } from "./api/routes/userRoutes";
import { connectDB } from "./api/db";
import path from "path";

const UPLOADS_DIR = path.resolve("./public/uploads");

async function startServer() {
  await connectDB();

  const server = serve({
    port: 4000,
    hostname: "0.0.0.0",

    routes: {
      /* ---------- Static Uploads ---------- */
      "/uploads/*": (req) => {
        const url = new URL(req.url);

        const filePath = path.join(
          UPLOADS_DIR,
          url.pathname.replace("/uploads/", ""),
        );

        const file = Bun.file(filePath);

        if (file.size === 0) {
          return new Response("Not Found", { status: 404 });
        }

        return new Response(file);
      },

      /* ---------- API Routes ---------- */
      ...authRoutes,
      ...quizRoutes,
      ...userRoutes,

      /* ---------- SPA Fallback ---------- */
      "/*": index,
    },
  });

  console.log(`Server running at ${server.url}`);
}

startServer();

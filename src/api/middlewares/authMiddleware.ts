import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export async function authMiddleware(
	req: Request,
	tokenName: string = "token"
) {
	const cookieHeader = req.headers.get("Cookie");
	console.log("Cookie header:", cookieHeader);

	if (!cookieHeader) {
		return {
			unauthorizedResponse: new Response("Unauthorized", { status: 401 }),
		};
	}

	// Parse cookies into an object
	const cookies = Object.fromEntries(
		cookieHeader.split("; ").map((c) => {
			const [key, v] = c.split("=");
			return [key, v];
		})
	);

	// Use the provided tokenName
	const token = cookies[tokenName];
	console.log(`Looking for token "${tokenName}" →`, token);

	if (!token) {
		return {
			unauthorizedResponse: new Response("Unauthorized", { status: 401 }),
		};
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		console.log("Decoded user:", decoded);
		return { decodedUser: decoded };
	} catch {
		return {
			unauthorizedResponse: new Response("Unauthorized", { status: 401 }),
		};
	}
}

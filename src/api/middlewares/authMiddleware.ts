import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export async function authMiddleware(
	req: Request,
	tokenName: string = "token"
) {
	const cookieHeader = req.headers.get("Cookie");

	if (!cookieHeader) {
		return {
			unauthorizedResponse: new Response("Unauthorized", { status: 401 }),
		};
	}

	const cookies = Object.fromEntries(
		cookieHeader.split("; ").map((c) => {
			const [key, v] = c.split("=");
			return [key, v];
		})
	);

	const token = cookies[tokenName];

	if (!token) {
		return {
			unauthorizedResponse: new Response("Unauthorized", { status: 401 }),
		};
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return { decodedUser: decoded };
	} catch {
		return {
			unauthorizedResponse: new Response("Unauthorized", { status: 401 }),
		};
	}
}

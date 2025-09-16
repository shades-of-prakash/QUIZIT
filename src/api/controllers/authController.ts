import { db } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const usersCollection = () => db!.collection("admin");

function generateToken(payload: object) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export async function login(req: Request) {
	try {
		const { username, password } = await req.json();

		if (!username || !password) {
			return new Response(
				JSON.stringify({ message: "Username and password required" }),
				{ status: 400 }
			);
		}

		const user = await usersCollection().findOne({ username });

		if (!user) {
			return new Response(
				JSON.stringify({ message: "Invalid username or password" }),
				{ status: 401 }
			);
		}

		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch) {
			return new Response(
				JSON.stringify({ message: "Invalid username or password" }),
				{ status: 401 }
			);
		}

		const token = generateToken({ username });
		const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax;`;
		const { password: _, ...safeUser } = user;
		return new Response(
			JSON.stringify({ message: "Login successful", data: safeUser }),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": cookie,
				},
			}
		);
	} catch {
		return new Response(JSON.stringify({ message: "Invalid request body" }), {
			status: 400,
		});
	}
}

export async function getUser(req: Request) {
	const { unauthorizedResponse, decodedUser } = await authMiddleware(req);
	if (unauthorizedResponse) {
		return unauthorizedResponse;
	}
	const decoded = decodedUser as { username: string };
	const user = await usersCollection().findOne(
		{ username: decoded.username },
		{ projection: { password: 0 } }
	);
	if (!user) {
		return new Response(JSON.stringify({ message: "User not found" }), {
			status: 404,
		});
	}

	return new Response(JSON.stringify(user), {
		headers: { "Content-Type": "application/json" },
	});
}

export async function logout(req: Request) {
	// Overwrite the token cookie with Max-Age=0 to remove it
	const cookie = `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;`;

	return new Response(JSON.stringify({ message: "Logout successful" }), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Set-Cookie": cookie,
		},
	});
}

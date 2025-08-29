import { db } from "../db";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const usersCollection = () => db!.collection<QuizUser>("quiz-users");

// ================= INTERFACE =================
interface QuizUser {
	_id: ObjectId;
	username: string;
	password: string;
	quizId: string;
	email: string;
	participant1?: string;
	participant2?: string;
}

// ================= HELPERS =================
function generateToken(payload: object) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

function hashPassword(password: string) {
	return crypto.createHash("sha256").update(password).digest("hex");
}

// ================= LOGIN =================
export async function userLogin(req: Request) {
	try {
		const { username, password, quizId, email, participant1, participant2 } =
			await req.json();

		console.log("Printing from login user useController");
		console.log("username", username);
		console.log("password", password);
		console.log("quizId", quizId);

		if (
			!username ||
			!password ||
			!quizId ||
			!email ||
			!participant1 ||
			!participant2
		) {
			return new Response(
				JSON.stringify({
					message:
						"Username, password, quizId, email, participant1 and participant2 required",
				}),
				{ status: 400 }
			);
		}

		const user = await usersCollection().findOne({
			username: username,
			quizId: quizId,
		});

		console.log("printing user from login user controller");
		console.log("user", user);
		if (!user) {
			return new Response(
				JSON.stringify({ message: "Invalid credentials or quiz" }),
				{ status: 401 }
			);
		}

		const hashedInput = hashPassword(password);

		if (hashedInput !== user.password) {
			return new Response(
				JSON.stringify({ message: "Invalid username or password" }),
				{ status: 401 }
			);
		}

		await usersCollection().updateOne(
			{ _id: user._id },
			{ $set: { participant1, participant2 } }
		);

		const token = generateToken({
			username,
			quizId,
			email,
			participant1,
			participant2,
		});

		const cookie = `user_token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax;`;

		const { password: _, ...safeUser } = {
			...user,
			participant1,
			participant2,
		};

		return new Response(
			JSON.stringify({
				message: "Login successful",
				data: safeUser,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": cookie,
				},
			}
		);
	} catch (err) {
		console.error("User login error:", err);
		return new Response(JSON.stringify({ message: "Invalid request body" }), {
			status: 400,
		});
	}
}

// ================= CURRENT USER =================
export async function getCurrentUser(req: Request) {
	const { unauthorizedResponse, decodedUser } = await authMiddleware(
		req,
		"user_token"
	);
	if (unauthorizedResponse) return unauthorizedResponse;
	console.log("decoder user", decodedUser);
	const decoded = decodedUser as {
		username: string;
		quizId: string;
		email: string;
		participant1: string;
		participant2: string;
	};
	console.log("decoded too", decoded);

	const user = await usersCollection().findOne(
		{
			username: decoded.username,
			quizId: decoded.quizId,
		},
		{ projection: { password: 0 } }
	);
	console.log("Printing user in getCurrentUser controller in /api/me route");
	console.log("user", user);

	if (!user) {
		return new Response(JSON.stringify({ message: "User not found" }), {
			status: 404,
		});
	}

	return new Response(JSON.stringify(user), {
		headers: { "Content-Type": "application/json" },
	});
}

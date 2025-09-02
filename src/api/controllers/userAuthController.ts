import { db } from "../db";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const usersCollection = () => db!.collection<QuizUser>("quiz-users");
const quizSessionCollection = () => db!.collection("quiz-session");

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

export async function userLogin(req: Request) {
	try {
		const { username, password, quizId, email, participant1, participant2 } =
			await req.json();

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

		// Check if user exists for this quiz
		const user = await usersCollection().findOne({ username, quizId });
		if (!user) {
			return new Response(
				JSON.stringify({ message: "Invalid credentials or quiz" }),
				{ status: 401 }
			);
		}

		// Password validation
		const hashedInput = hashPassword(password);
		if (hashedInput !== user.password) {
			return new Response(
				JSON.stringify({ message: "Invalid username or password" }),
				{ status: 401 }
			);
		}

		// Check if user has already completed the quiz
		const completedSession = await quizSessionCollection().findOne({
			userId: user._id.toString(),
			quizId,
			completed: true,
		});

		if (completedSession) {
			return new Response(
				JSON.stringify({
					message: "User has already completed this quiz",
				}),
				{ status: 403 }
			);
		}

		// Check if user is already in an active session
		const activeSession = await quizSessionCollection().findOne({
			userId: user._id.toString(),
			quizId,
			completed: false,
			endTime: { $gt: Date.now() },
		});

		if (activeSession) {
			return new Response(
				JSON.stringify({
					message: "User already in an active quiz session",
					sessionId: activeSession._id,
				}),
				{ status: 403 }
			);
		}

		// Prevent duplicate participants across different teams
		const existingTeam = await usersCollection().findOne({
			quizId,
			$or: [{ participant1 }, { participant2 }],
			_id: { $ne: user._id },
		});

		if (existingTeam) {
			const samePair =
				(existingTeam.participant1 === participant1 &&
					existingTeam.participant2 === participant2) ||
				(existingTeam.participant1 === participant2 &&
					existingTeam.participant2 === participant1);

			if (!samePair) {
				return new Response(
					JSON.stringify({
						message:
							"Participant already registered in another team for this quiz",
					}),
					{ status: 400 }
				);
			}
		}

		// Update participants + email for this user
		await usersCollection().updateOne(
			{ _id: user._id },
			{ $set: { participant1, participant2, email } }
		);

		// Generate JWT token
		const token = generateToken({
			username,
			quizId,
			email,
			participant1,
			participant2,
		});

		const cookie = `user_token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax;`;

		// Return user data without password
		const { password: _, ...safeUser } = {
			...user,
			participant1,
			participant2,
			email,
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

export async function userLogout(_req: Request) {
	try {
		const cookie = "user_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;";

		return new Response(JSON.stringify({ message: "Logout successful" }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": cookie,
			},
		});
	} catch (err) {
		console.error("Logout error:", err);
		return new Response(JSON.stringify({ message: "Logout failed" }), {
			status: 500,
		});
	}
}

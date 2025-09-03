import { db } from "../db";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const usersCollection = () => db!.collection<QuizUser>("quiz-users");
const quizSessionCollection = () => db!.collection("quiz-session");

interface QuizUser {
	_id: ObjectId;
	username: string;
	password: string;
	quizId: string;
	email: string;
	participant1Name: string;
	participant1RollNo: string;
	participant2Name?: string;
	participant2RollNo?: string;
	collegeName: string;
	phoneNumber: string;
}

function generateToken(payload: object) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

function hashPassword(password: string) {
	return crypto.createHash("sha256").update(password).digest("hex");
}

export async function userLogin(req: Request) {
	try {
		const {
			username,
			password,
			quizId,
			email,
			participant1Name,
			participant1RollNo,
			participant2Name,
			participant2RollNo,
			collegeName,
			phoneNumber,
		} = await req.json();

		// ✅ Require participant1, others optional
		if (
			!username ||
			!password ||
			!quizId ||
			!email ||
			!participant1Name ||
			!participant1RollNo ||
			!collegeName ||
			!phoneNumber
		) {
			return new Response(
				JSON.stringify({
					message:
						"Username, password, quizId, email, participant1, rollNo, collegeName and phoneNumber are required",
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

		// Check if user is already in an active
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

		const duplicateCheckConditions: any[] = [
			{ participant1Name },
			{ participant1RollNo },
		];
		if (participant2Name) duplicateCheckConditions.push({ participant2Name });
		if (participant2RollNo)
			duplicateCheckConditions.push({ participant2RollNo });

		const existingTeam = await usersCollection().findOne({
			quizId,
			$or: duplicateCheckConditions,
			_id: { $ne: user._id },
		});

		if (existingTeam) {
			return new Response(
				JSON.stringify({
					message:
						"One or more participants are already registered in another team",
				}),
				{ status: 400 }
			);
		}

		await usersCollection().updateOne(
			{ _id: user._id },
			{
				$set: {
					participant1Name,
					participant1RollNo,
					participant2Name: participant2Name || null,
					participant2RollNo: participant2RollNo || null,
					collegeName,
					phoneNumber,
					email,
				},
			}
		);

		const token = generateToken({
			username,
			quizId,
			email,
			participant1Name,
			participant1RollNo,
			participant2Name: participant2Name || null,
			participant2RollNo: participant2RollNo || null,
			collegeName,
			phoneNumber,
		});

		const cookie = `user_token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax;`;

		const { password: _, ...safeUser } = {
			...user,
			participant1Name,
			participant1RollNo,
			participant2Name: participant2Name || null,
			participant2RollNo: participant2RollNo || null,
			collegeName,
			phoneNumber,
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

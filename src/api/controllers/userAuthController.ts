import { db } from "../db";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/authMiddleware";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const usersCollection = () => db!.collection<QuizUser>("quiz-users");
const quizSessionCollection = () => db!.collection("quiz-session");
const quizzesCollection = () => db!.collection("quizzes");

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

		// ✅ Required fields
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
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// ✅ Check if user exists
		const user = await usersCollection().findOne({ username, quizId });
		if (!user) {
			return new Response(
				JSON.stringify({ message: "Invalid credentials or quiz" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		// ✅ Password validation
		const hashedInput = hashPassword(password);
		if (hashedInput !== user.password) {
			return new Response(
				JSON.stringify({ message: "Invalid username or password" }),
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}

		// ✅ Check if quiz already completed
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
				{ status: 403, headers: { "Content-Type": "application/json" } }
			);
		}

		// ✅ Prevent duplicate roll numbers across teams
		const duplicateCheckConditions: any[] = [{ participant1RollNo }];
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
						"One or more roll numbers are already registered in another team",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// ✅ Update user info
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

		// ✅ Generate JWT
		const token = generateToken({
			userId: user._id.toString(),
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
		const cookie = `user_token=${token}; HttpOnly; Path=/; Max-Age=7200; SameSite=Lax;`;

		// remove password before sending
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
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function getCurrentUser(req: Request) {
	const { unauthorizedResponse, decodedUser } = await authMiddleware(
		req,
		"user_token"
	);

	if (unauthorizedResponse) {
		return new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	const decoded = decodedUser as {
		username: string;
		quizId: string;
		email: string;
		participant1: string;
		participant2: string;
	};

	const user = await usersCollection().findOne(
		{ username: decoded.username, quizId: decoded.quizId },
		{ projection: { password: 0 } }
	);

	if (!user) {
		return new Response(JSON.stringify({ user: null }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ user }), {
		status: 200,
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

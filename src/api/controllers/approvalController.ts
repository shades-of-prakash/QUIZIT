import { db } from "../db";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const ADMIN_REVOKE_PIN_HASH = bcrypt.hashSync("8344", 10);
const usersCollection = () => db!.collection("quiz-users");
const approvalRequestsCollection = () => db!.collection("approval_requests");

function generateToken(payload: object) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export async function requestApproval(req: Request) {
	try {
		const data = await req.json();
		const { quizId, participant1RollNo } = data;

		if (!quizId || !participant1RollNo) {
			return new Response(JSON.stringify({ message: "Quiz ID and Roll No required" }), { status: 400 });
		}

		// Check if user has already submitted this quiz
		const quizSubmissionCollection = db!.collection("quiz-submission");
		const existingSubmission = await quizSubmissionCollection.findOne({ quizId, participant1RollNo });
		
		if (existingSubmission) {
			return new Response(JSON.stringify({ message: "You have already completed this exam." }), { status: 400 });
		}

		// Upsert the request so if they re-request (e.g. crash), it updates
		await approvalRequestsCollection().updateOne(
			{ quizId, participant1RollNo },
			{ 
                $set: { 
                    ...data, 
                    status: "PENDING", 
                    requestedAt: new Date() 
                } 
            },
			{ upsert: true }
		);

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
	}
}

export async function checkApprovalStatus(req: Request) {
	try {
		const url = new URL(req.url);
		const quizId = url.searchParams.get("quizId");
		const participant1RollNo = url.searchParams.get("participant1RollNo");

		if (!quizId || !participant1RollNo) {
			return new Response(JSON.stringify({ message: "Missing params" }), { status: 400 });
		}

		const request = await approvalRequestsCollection().findOne({ quizId, participant1RollNo });
		
		if (!request) {
			return new Response(JSON.stringify({ status: "NOT_FOUND" }));
		}

		if (request.status === "APPROVED") {
			// Find the assigned user to generate the token
			const user = await usersCollection().findOne({ quizId, participant1RollNo });
			if (!user) {
				return new Response(JSON.stringify({ status: "PENDING" })); // Should not happen if assigned correctly
			}

			const token = generateToken({
				userId: user._id.toString(),
				username: user.username,
				quizId: user.quizId,
				email: user.email,
				participant1Name: user.participant1Name,
				participant1RollNo: user.participant1RollNo,
				participant2Name: user.participant2Name || null,
				participant2RollNo: user.participant2RollNo || null,
				collegeName: user.collegeName,
				phoneNumber: user.phoneNumber,
			});
			const cookie = `user_token=${token}; HttpOnly; Path=/; Max-Age=7200; SameSite=Lax;`;

			return new Response(JSON.stringify({ status: "APPROVED", user }), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Set-Cookie": cookie,
				},
			});
		}

		return new Response(JSON.stringify({ status: request.status }));
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
	}
}

export async function getAdminLiveDashboard(req: Request) {
	const { unauthorizedResponse } = await authMiddleware(req);
	if (unauthorizedResponse) return unauthorizedResponse;

	try {
		const requests = await approvalRequestsCollection().find({}).sort({ requestedAt: -1 }).toArray();

		// Map to attach tabSwitchCount (F11 exits/tab switches)
		const users = await usersCollection().find({}).toArray();
		const userMap = new Map();
		users.forEach(u => userMap.set(`${u.quizId}_${u.participant1RollNo}`, u._id.toString()));

		const sessions = await db!.collection("quiz-session").find({}).toArray();
		const sessionMap = new Map();
		sessions.forEach(s => sessionMap.set(`${s.quizId}_${s.userId}`, s.tabSwitchCount || 0));

		const requestsWithCounts = requests.map(req => {
			const userId = userMap.get(`${req.quizId}_${req.participant1RollNo}`);
			const tabSwitchCount = userId ? (sessionMap.get(`${req.quizId}_${userId}`) || 0) : 0;
			return { ...req, tabSwitchCount };
		});

		return new Response(JSON.stringify({ requests: requestsWithCounts }));
	} catch (err) {
		console.error("Dashboard error:", err);
		return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
	}
}

export async function approveRequest(req: Request) {
	const { unauthorizedResponse } = await authMiddleware(req);
	if (unauthorizedResponse) return unauthorizedResponse;

	try {
		const { _id, quizId, participant1RollNo } = await req.json();
		const ObjectId = require("mongodb").ObjectId;

		// 1. Check if they already have an assigned QuizUser
		let assignedUser = await usersCollection().findOne({ quizId, participant1RollNo });
		
		const requestData = await approvalRequestsCollection().findOne({ _id: new ObjectId(_id) });
		if (!requestData) {
			return new Response(JSON.stringify({ message: "Request not found" }), { status: 404 });
		}

		if (!assignedUser) {
			// Auto-create a QuizUser for this student
			const newUser = {
				username: `${requestData.participant1Name.replace(/\s+/g, "").toLowerCase()}_${requestData.participant1RollNo}`,
				password: "auto-generated-password", // passwordless now, so doesn't matter
				quizId,
				participant1Name: requestData.participant1Name,
				participant1RollNo: requestData.participant1RollNo,
				participant2Name: requestData.participant2Name || null,
				participant2RollNo: requestData.participant2RollNo || null,
				collegeName: requestData.collegeName,
				phoneNumber: requestData.phoneNumber,
				email: requestData.email,
			};
			
			const insertResult = await usersCollection().insertOne(newUser);
			assignedUser = { ...newUser, _id: insertResult.insertedId };
		} else {
			// Update the existing assigned user
			await usersCollection().updateOne(
				{ _id: assignedUser._id },
				{
					$set: {
						participant1Name: requestData.participant1Name,
						participant1RollNo: requestData.participant1RollNo,
						participant2Name: requestData.participant2Name || null,
						participant2RollNo: requestData.participant2RollNo || null,
						collegeName: requestData.collegeName,
						phoneNumber: requestData.phoneNumber,
						email: requestData.email,
					}
				}
			);
		}

		// 4. Mark request as approved
		await approvalRequestsCollection().updateOne(
			{ _id: new ObjectId(_id) },
			{ $set: { status: "APPROVED", approvedAt: new Date() } }
		);

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
	}
}

export async function updateRequestStatus(req: Request) {
	const { unauthorizedResponse } = await authMiddleware(req);
	if (unauthorizedResponse) return unauthorizedResponse;

	try {
		const { _id, status, pin } = await req.json();
		const ObjectId = require("mongodb").ObjectId;

		if (status === "REVOKED" || status === "DELETED") {
			if (status === "REVOKED") {
				const isValidPin = await bcrypt.compare(String(pin || ""), ADMIN_REVOKE_PIN_HASH);
				if (!isValidPin) {
					return new Response(JSON.stringify({ message: "Invalid PIN" }), { status: 403 });
				}
			}

			// Find the request first to get user details
			const request = await approvalRequestsCollection().findOne({ _id: new ObjectId(_id) });
			
			if (request) {
				const { quizId, participant1RollNo } = request;
				
				// Find the user to get userId
				const user = await usersCollection().findOne({ quizId, participant1RollNo });
				
				if (user) {
					const userId = user._id.toString();
					const quizSessionCollection = db!.collection("quiz-session");
					
					// Find their active session
					const session = await quizSessionCollection.findOne({ userId, quizId, completed: false });
					
					if (session) {
						// Auto-submit their progress
						const quizzesCollection = db!.collection("quizzes");
						const quiz = await quizzesCollection.findOne({ _id: new ObjectId(quizId) });
						const durationMinutes = quiz?.duration || 0;
						
						const remaining = Math.max(Number(session.remainingSeconds || 0), 0);
						const totalSeconds = durationMinutes * 60;
						const consumedSeconds = Math.max(totalSeconds - remaining, 0);
						const minutes = Math.floor(consumedSeconds / 60);
						const seconds = consumedSeconds % 60;
						const timeConsumed = `${minutes}m ${seconds}s`;

						const submissionData: Record<string, any> = {
							userId,
							quizId,
							questions: session.questions,
							participant1Name: user.participant1Name,
							participant1RollNo: user.participant1RollNo,
							email: user.email || null,
							submittedAt: Date.now(),
							timeConsumed,
						};

						if (user.participant2Name) submissionData.participant2Name = user.participant2Name;
						if (user.participant2RollNo) submissionData.participant2RollNo = user.participant2RollNo;

						const quizSubmission = db!.collection("quiz-submission");
						await quizSubmission.updateOne(
							{ userId, quizId },
							{ $set: submissionData },
							{ upsert: true }
						);

						// Mark session as completed
						await quizSessionCollection.updateOne(
							{ _id: session._id },
							{ $set: { completed: true } }
						);
					}
				}
			}
			
			await approvalRequestsCollection().deleteOne({ _id: new ObjectId(_id) });
		} else {
			await approvalRequestsCollection().updateOne(
				{ _id: new ObjectId(_id) },
				{ $set: { status } }
			);
		}

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
	}
}

export async function cancelApprovalRequest(req: Request) {
	try {
		const data = await req.json();
		const { quizId, participant1RollNo } = data;

		if (!quizId || !participant1RollNo) {
			return new Response(JSON.stringify({ message: "Missing params" }), { status: 400 });
		}

		// Delete the pending request so it's cancelled
		await approvalRequestsCollection().deleteOne({ 
			quizId, 
			participant1RollNo, 
			status: "PENDING" 
		});

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		console.error("Cancel approval error:", err);
		return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
	}
}


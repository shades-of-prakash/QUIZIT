import { ObjectId } from "mongodb";
import { db } from "../db";
import { authMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface QuizUser {
	_id: ObjectId;
	username: string;
	password: string;
	quizId: string;
	email: string;
	participant1?: string;
	participant2?: string;
}

const quizzesCollection = () => db!.collection("quizzes");
const quizSessionCollection = () => db!.collection("quiz-session");
const quizSubmission = () => db!.collection("quiz-submission");
const usersCollection = () => db!.collection<QuizUser>("quiz-users");

function generateUserCredentials(quizName: string, index: number) {
	const normalized = quizName.toLowerCase().replace(/\s+/g, "");
	const username = `${normalized}_user_${index}`;
	const password = `${quizName.replace(/\s+/g, "")}${100 + index}!`;
	console.log("username", username, "password", password);
	return { username, password };
}

const quizUsersCollection = () => db!.collection("quiz-users");

export async function createQuiz(req: Request) {
	const { unauthorizedResponse } = await authMiddleware(req);
	if (unauthorizedResponse) return unauthorizedResponse;

	try {
		const body = await req.json();
		const {
			name,
			duration,
			quizQuestions,
			totalQuestions,
			teamSize,
			questions,
		} = body;

		if (
			!name ||
			!Array.isArray(questions) ||
			questions.length === 0 ||
			!duration ||
			!quizQuestions ||
			!totalQuestions ||
			!teamSize
		) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid input - missing required fields",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		if (quizQuestions > totalQuestions) {
			return new Response(
				JSON.stringify({
					success: false,
					message: `quizQuestions (${quizQuestions}) cannot be greater than totalQuestions (${totalQuestions}).`,
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const durationNum = parseInt(duration);
		const quizQuestionsNum = parseInt(quizQuestions);
		const totalQuestionsNum = parseInt(totalQuestions);
		const teamSizeNum = parseInt(teamSize);

		if (
			isNaN(durationNum) ||
			durationNum <= 0 ||
			isNaN(quizQuestionsNum) ||
			quizQuestionsNum <= 0 ||
			isNaN(totalQuestionsNum) ||
			totalQuestionsNum <= 0 ||
			isNaN(teamSizeNum) ||
			teamSizeNum <= 0
		) {
			return new Response(
				JSON.stringify({
					success: false,
					message:
						"Duration, quizQuestions, totalQuestions, and teamSize must be positive numbers",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		if (teamSizeNum !== 1 && teamSizeNum !== 2) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Team size must be either 1 (Individual) or 2 (Dual)",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		for (const question of questions) {
			if (
				!question.sno ||
				!question.question ||
				!Array.isArray(question.options) ||
				question.options.length === 0 ||
				!Array.isArray(question.correct_options) ||
				typeof question.multiple !== "boolean"
			) {
				return new Response(
					JSON.stringify({
						success: false,
						message:
							"Invalid question format - each must have sno, question, options[], correct_options[], and multiple (boolean)",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } }
				);
			}
		}

		const quizDoc = {
			name,
			duration: durationNum,
			quizQuestions: quizQuestionsNum,
			totalQuestions: totalQuestionsNum,
			teamSize: teamSizeNum,
			questions,
			createdAt: new Date(),
		};

		await quizzesCollection().insertOne(quizDoc);

		return new Response(
			JSON.stringify({ success: true, message: "Quiz created successfully" }),
			{ status: 201, headers: { "Content-Type": "application/json" } }
		);
	} catch (err) {
		console.error("Error creating quiz:", err);
		return new Response(
			JSON.stringify({ success: false, message: "Server error" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

export async function getAllQuizzes(req: Request) {
	const { unauthorizedResponse } = await authMiddleware(req);
	if (unauthorizedResponse) return unauthorizedResponse;

	try {
		const quizzes = await quizzesCollection().find({}).toArray();
		console.log("quizzes", quizzes);

		return new Response(JSON.stringify(quizzes), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Failed to fetch quizzes:", error);
		return new Response(
			JSON.stringify({ message: "Failed to fetch quizzes" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

export async function createQuizUsers(req: Request) {
	const { unauthorizedResponse } = await authMiddleware(req);
	if (unauthorizedResponse) return unauthorizedResponse;

	const startTime = Date.now();

	try {
		const body = await req.json();
		const { quizId, count } = body;

		if (!quizId || !count || count <= 0) {
			return new Response(
				JSON.stringify({ message: "quizId and positive count required" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const quiz: any = await quizzesCollection().findOne({
			_id: ObjectId.createFromHexString(quizId),
		});
		console.log("quiz values", quiz);
		if (!quiz) {
			return new Response(JSON.stringify({ message: "Quiz not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const existingUsers = await quizUsersCollection()
			.find({ quizId })
			.sort({ username: 1 })
			.toArray();

		const startIndex = existingUsers.length + 1;

		const createdUsers: any[] = [];
		const usersToInsert: any[] = [];

		for (let i = 0; i < count; i++) {
			const index = startIndex + i;
			const { username, password } = generateUserCredentials(quiz.name, index);
			const hashedPassword = crypto
				.createHash("sha256")
				.update(password)
				.digest("hex");

			usersToInsert.push({
				username,
				password: hashedPassword,
				quizId,
				quizDuration: quiz.duration,
				createdAt: new Date(),
			});

			createdUsers.push({ username, password });
		}

		const insertStart = Date.now();
		await quizUsersCollection().insertMany(usersToInsert);
		const insertEnd = Date.now();

		const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
		const insertTime = ((insertEnd - insertStart) / 1000).toFixed(2);

		return new Response(
			JSON.stringify({
				message: `${count} users created for quiz "${quiz.name}"`,
				users: createdUsers,
				time: { insertTime, totalTime },
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (err: any) {
		return new Response(
			JSON.stringify({ message: err.message || "Error creating users" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

export async function getSingleQuiz(req: Request) {
	try {
		const body = await req.json();
		const { quizId } = body;

		if (!quizId) {
			return new Response(JSON.stringify({ message: "Quiz ID is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const quiz = await quizzesCollection().findOne({
			_id: ObjectId.createFromHexString(quizId),
		});

		if (!quiz) {
			return new Response(JSON.stringify({ message: "Quiz not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const shuffled = [...quiz.questions].sort(() => 0.5 - Math.random());
		const selectedQuestions = shuffled.slice(0, quiz.quizQuestions);

		const { correct_options, questions, ...quizMeta } = quiz;

		const modifiedQuiz = {
			...quizMeta,
			questions: selectedQuestions,
		};

		return new Response(JSON.stringify(modifiedQuiz), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("getSingleQuiz error:", err);
		return new Response(JSON.stringify({ message: "Server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function getQuizNames(req: Request): Promise<Response> {
	try {
		const quizzes = await quizzesCollection()
			.find({}, { projection: { name: 1, teamSize: 1 } })
			.toArray();

		const quizNames = quizzes.map((q) => ({
			id: q._id.toString(),
			name: q.name,
			teamSize: q.teamSize,
		}));

		return new Response(JSON.stringify({ success: true, data: quizNames }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error fetching quiz names:", error);
		return new Response(
			JSON.stringify({ success: false, message: "Internal server error" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

export async function createQuizSessionController(req: Request) {
	try {
		const body = await req.json();
		const { userId, quizId, quizDuration } = body;

		if (!userId || !quizId || !quizDuration) {
			return new Response(
				JSON.stringify({ error: "Missing userId, quizId, or quizDuration" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const existingSession = await quizSessionCollection().findOne({
			userId,
			quizId,
		});

		console.log(existingSession);

		if (existingSession?.completed) {
			return new Response(JSON.stringify({ error: "Quiz already completed" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		let questions: any[] = [];

		if (existingSession) {
			questions = existingSession.questions.map((q: any) => ({
				...q,
				user_options: Array.isArray(q.user_options) ? q.user_options : [],
			}));

			const needsUpdate = existingSession.questions.some(
				(q: any) => !Array.isArray(q.user_options)
			);

			if (needsUpdate) {
				await quizSessionCollection().updateOne(
					{ _id: existingSession._id },
					{ $set: { questions } }
				);
			}
		} else {
			const quiz = await quizzesCollection().findOne({
				_id: ObjectId.createFromHexString(quizId),
			});

			if (!quiz) {
				return new Response(JSON.stringify({ error: "Quiz not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});
			}

			const shuffled = [...quiz.questions].sort(() => 0.5 - Math.random());
			questions = shuffled
				.slice(0, quiz.quizQuestions)
				.map(({ correct_options, ...q }) => ({
					...q,
					user_options: [],
				}));

			await quizSessionCollection().insertOne({
				userId,
				quizId,
				questions,
				remainingSeconds: quizDuration * 60,
				lastUpdated: Date.now(),
				completed: false,
				activeQuestion: 0,
				skippedQuestions: [],
			});
		}

		console.log("questions", { questions });
		return new Response(
			JSON.stringify({
				userId,
				quizId,
				questions,
				remainingSeconds: existingSession
					? existingSession.remainingSeconds
					: quizDuration * 60,
				lastUpdated: existingSession?.lastUpdated ?? Date.now(),
				activeQuestion: existingSession?.activeQuestion ?? 0,
				skippedQuestions: existingSession?.skippedQuestions ?? [],
				completed: existingSession?.completed ?? false,
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (err) {
		console.error("DB error", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function getQuizRemainingTimeController(req: Request) {
	const url = new URL(req.url);
	const userId = url.searchParams.get("userId");
	const quizId = url.searchParams.get("quizId");

	if (!userId || !quizId) {
		return new Response(JSON.stringify({ error: "Missing userId or quizId" }), {
			status: 400,
		});
	}

	try {
		const session = await quizSessionCollection().findOne({ userId, quizId });

		if (!session) {
			return new Response(JSON.stringify({ error: "Session not found" }), {
				status: 404,
			});
		}

		return new Response(
			JSON.stringify({ remainingSeconds: session.remainingSeconds }),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (err) {
		console.error("DB error", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
export async function updateQuizSessionController(req: Request) {
	try {
		const body = await req.json();
		const { userId, quizId, remainingSeconds } = body;

		if (!userId || !quizId || remainingSeconds === undefined) {
			return new Response(
				JSON.stringify({
					error: "Missing userId, quizId, or remainingSeconds",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		await quizSessionCollection().updateOne(
			{ userId, quizId },
			{
				$set: {
					remainingSeconds: Math.max(0, remainingSeconds),
					lastUpdated: Date.now(),
				},
			}
		);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("DB error", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function checkSessionController(req: Request) {
	try {
		const { userId, quizId } = await req.json();

		const session = await quizSessionCollection().findOne({
			userId,
			quizId,
		});

		if (!session) {
			return new Response(JSON.stringify({ error: "No session found" }), {
				status: 404,
			});
		}

		return new Response(
			JSON.stringify({ completed: session.completed || false }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (err) {
		console.error("Error checking session", err);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}

export async function submitQuizController(req: Request) {
	try {
		const body = await req.json();
		const {
			userId,
			quizId,
			participant1Name,
			participant1RollNo,
			participant2Name,
			participant2RollNo,
			email,
		} = body;

		if (!userId || !quizId || !participant1Name || !participant1RollNo) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const now = Date.now();

		const session = await quizSessionCollection().findOneAndUpdate(
			{
				userId,
				quizId,
				completed: false,
				$expr: {
					$gt: [
						{
							$add: [
								"$lastUpdated",
								{ $multiply: ["$remainingSeconds", 1000] },
							],
						},
						now,
					],
				},
			},
			{ $set: { completed: true } },
			{ returnDocument: "after" }
		);

		if (!session) {
			return new Response(
				JSON.stringify({ error: "Quiz already submitted or expired" }),
				{ status: 403, headers: { "Content-Type": "application/json" } }
			);
		}

		if (!Array.isArray(session.questions) || session.questions.length === 0) {
			return new Response(
				JSON.stringify({ error: "No questions found in session" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const submissionData: Record<string, any> = {
			userId,
			quizId,
			questions: session.questions,
			participant1Name,
			participant1RollNo,
			email,
			submittedAt: now,
		};

		if (participant2Name) submissionData.participant2Name = participant2Name;
		if (participant2RollNo)
			submissionData.participant2RollNo = participant2RollNo;

		await quizSubmission().updateOne(
			{ userId, quizId },
			{ $set: submissionData },
			{ upsert: true }
		);

		return new Response(
			JSON.stringify({ message: "Quiz submitted successfully" }),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (err) {
		console.error("Submit error:", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function saveSessionStateController(req: Request) {
	try {
		const body = await req.json();
		const { userId, quizId, questions, activeQuestion, skippedQuestions } =
			body;

		if (!userId || !quizId) {
			return new Response(
				JSON.stringify({ error: "Missing userId or quizId" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// ensure session exists
		const session = await quizSessionCollection().findOne({ userId, quizId });
		if (!session) {
			return new Response(
				JSON.stringify({ error: "No active quiz session found" }),
				{ status: 404, headers: { "Content-Type": "application/json" } }
			);
		}

		const updates: any = { lastUpdated: Date.now() };

		if (questions !== undefined) updates.questions = questions;
		if (activeQuestion !== undefined) updates.activeQuestion = activeQuestion;
		if (skippedQuestions !== undefined)
			updates.skippedQuestions = skippedQuestions;

		await quizSessionCollection().updateOne(
			{ userId, quizId },
			{ $set: updates }
		);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("Error saving session state:", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function getQuizResultsController(req: Request) {
	try {
		const url = new URL(req.url);
		const quizId = url.searchParams.get("quizId");

		if (!quizId) {
			return new Response(JSON.stringify({ error: "Missing quizId" }), {
				status: 400,
			});
		}

		const submissions = await quizSubmission().find({ quizId }).toArray();
		if (!submissions || submissions.length === 0) {
			return new Response(JSON.stringify({ error: "No submissions found" }), {
				status: 404,
			});
		}

		const quiz = await quizzesCollection().findOne({
			_id: new ObjectId(quizId),
		});
		if (!quiz || !quiz.questions) {
			return new Response(JSON.stringify({ error: "Quiz not found" }), {
				status: 404,
			});
		}

		const quizQuestionsMap: Record<string, any> = {};
		quiz.questions.forEach((q: any) => {
			quizQuestionsMap[q.sno] = q;
		});

		const results = await Promise.all(
			submissions.map(async (submission: any) => {
				let score = 0;

				for (const key in submission.answers) {
					const userAnswer = submission.answers[key] || [];
					const question = quizQuestionsMap[key];
					if (!question) continue;

					const correct = Array.isArray(question.correct_options)
						? question.correct_options
						: [question.correct_options];

					const isCorrect =
						userAnswer.length === correct.length &&
						userAnswer.every((val: number) => correct.includes(val));

					if (isCorrect) score++;
				}

				const submittedAtRaw = submission.submittedAt || null;
				const submittedAtFormatted = submittedAtRaw
					? new Date(submittedAtRaw).toLocaleString()
					: null;

				// Fetch session to get remainingSeconds
				const session = await quizSessionCollection().findOne({
					quizId,
					userId: submission.userId,
				});

				let timeConsumedMinutes: number | null = null;
				let timeConsumedFormatted: string | null = null;

				if (quiz.duration && session?.remainingSeconds != null) {
					const totalSeconds = quiz.duration * 60;
					const consumedSeconds = totalSeconds - session.remainingSeconds;

					timeConsumedMinutes = Math.floor(consumedSeconds / 60);
					timeConsumedFormatted = `${timeConsumedMinutes} min`;
				}

				return {
					userId: submission.userId,
					email: submission.email || "N/A",
					participant1Name: submission.participant1Name,
					participant1RollNo: submission.participant1RollNo,
					participant2Name: submission.participant2Name || null,
					participant2RollNo: submission.participant2RollNo || null,
					score,
					submittedAt: submittedAtRaw,
					submittedAtFormatted,
					timeConsumedMinutes,
					timeConsumedFormatted,
				};
			})
		);

		return new Response(JSON.stringify({ quizId, results }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("Get quiz results error", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
}

export async function deleteQuizController(req: Request) {
	// const { unauthorizedResponse } = await authMiddleware(req);
	// if (unauthorizedResponse) return unauthorizedResponse;
	try {
		const url = new URL(req.url);
		const quizId = url.searchParams.get("quizId");

		if (!quizId) {
			return new Response(JSON.stringify({ error: "quizId is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Delete quiz
		await quizzesCollection().deleteOne({
			_id: ObjectId.createFromHexString(quizId),
		});

		// Delete related users
		await usersCollection().deleteMany({ quizId });

		// Delete quiz sessions
		await quizSessionCollection().deleteMany({ quizId });

		// Delete quiz submissions
		await quizSubmission().deleteMany({ quizId });

		return new Response(
			JSON.stringify({
				message: `Quiz ${quizId} and all related data deleted.`,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (err) {
		console.error(err);
		return new Response(
			JSON.stringify({ error: "Failed to delete quiz data" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}
export async function getSessionController(req: Request) {
	try {
		const url = new URL(req.url);
		const userId = url.searchParams.get("userId");
		const quizId = url.searchParams.get("quizId");

		if (!userId || !quizId) {
			return new Response(
				JSON.stringify({ error: "Missing userId or quizId" }),
				{ status: 400 }
			);
		}

		const session = await quizSessionCollection().findOne({ userId, quizId });

		if (!session) {
			return new Response(
				JSON.stringify({ error: "No active session found" }),
				{ status: 404 }
			);
		}

		return new Response(
			JSON.stringify({
				userId: session.userId,
				quizId: session.quizId,
				remainingSeconds: session.remainingSeconds,
				completed: session.completed || false,
				questions: session.questions,
				activeQuestion: session.activeQuestion,
				skippedQuestions: session.skippedQuestions,
				lastUpdated: session.lastUpdated,
			}),
			{ status: 200 }
		);
	} catch (err) {
		console.error("Error fetching session:", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
}

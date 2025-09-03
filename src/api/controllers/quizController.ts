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

		console.log("exist", existingSession);

		if (existingSession?.completed) {
			return new Response(JSON.stringify({ error: "Quiz already completed" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		const startTime = Date.now();
		const endTime = startTime + quizDuration * 60 * 1000;

		await quizSessionCollection().updateOne(
			{ userId, quizId },
			{
				$set: {
					userId,
					quizId,
					startTime,
					endTime,
					quizDuration,
					completed: false,
				},
			},
			{ upsert: true }
		);

		return new Response(
			JSON.stringify({ userId, quizId, startTime, endTime, quizDuration }),
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

export async function getServerTimeController(req: Request) {
	return new Response(JSON.stringify({ serverTime: Date.now() }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

export async function getQuizEndTimeController(req: Request) {
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

		if (!session || !session.startTime || !session.quizDuration) {
			return new Response(JSON.stringify({ error: "Session not found" }), {
				status: 404,
			});
		}

		const startTime =
			session.startTime instanceof Date
				? session.startTime.getTime()
				: session.startTime;

		const endTime = startTime + session.quizDuration * 60 * 1000;

		return new Response(JSON.stringify({ endTime }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error("DB error", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
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
		const { userId, quizId, answers, participant1, participant2, email } = body;

		if (!userId || !quizId || !answers) {
			return new Response(
				JSON.stringify({ error: "Missing userId, quizId, or answers" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		console.log("tesyynh", userId);

		const now = Date.now();

		const session = await quizSessionCollection().findOneAndUpdate(
			{
				userId,
				quizId,
				completed: false,
				endTime: { $gt: now },
			},
			{ $set: { completed: true } },
			{ returnDocument: "after" }
		);
		console.log("session", session);

		if (!session) {
			return new Response(
				JSON.stringify({ error: "Quiz already submitted or expired" }),
				{ status: 403, headers: { "Content-Type": "application/json" } }
			);
		}

		await quizSubmission().updateOne(
			{ userId, quizId },
			{
				$set: {
					answers,
					participant1,
					participant2,
					email,
					submittedAt: now,
				},
			},
			{ upsert: true }
		);

		return new Response(
			JSON.stringify({ message: "Quiz submitted successfully" }),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (err) {
		console.error("Submit error", err);
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
				headers: { "Content-Type": "application/json" },
			});
		}

		const submissions = await quizSubmission().find({ quizId }).toArray();

		if (!submissions || submissions.length === 0) {
			return new Response(JSON.stringify({ error: "No submissions found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const quiz = await quizzesCollection().findOne({
			_id: ObjectId.createFromHexString(quizId),
		});
		if (!quiz || !quiz.questions) {
			return new Response(JSON.stringify({ error: "Quiz not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const results = await Promise.all(
			submissions.map(async (submission: any, index: number) => {
				let score = 0;

				quiz.questions.forEach((q: any, qIndex: number) => {
					const userAnswer = submission.answers[qIndex] || [];
					const correct = Array.isArray(q.correctAnswers)
						? q.correctAnswers
						: [q.correctAnswers];

					const isCorrect =
						userAnswer.length === correct.length &&
						userAnswer.every((val: number) => correct.includes(val));

					if (isCorrect) score++;
				});
				console.log("submission", submission.userId);
				const user = await usersCollection().findOne({
					_id: ObjectId.createFromHexString(submission.userId),
				});

				console.log("userfrom results controller", user);

				return {
					participant1: user?.participant1,
					participant2: user?.participant2,
					userId: submission.userId,
					email: user?.email || "N/A",
					score,
					submittedAt: submission.submittedAt || null,
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
			headers: { "Content-Type": "application/json" },
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

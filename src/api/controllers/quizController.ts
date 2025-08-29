import { ObjectId } from "mongodb";
import { db } from "../db";
import { authMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const quizzesCollection = () => db!.collection("quizzes");
const quizSessionCollection = () => db!.collection("quiz-session");

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
		const { name, duration, quizQuestions, totalQuestions, questions } = body;

		if (
			!name ||
			!Array.isArray(questions) ||
			questions.length === 0 ||
			!duration ||
			!quizQuestions ||
			!totalQuestions
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
		// Validate numeric fields
		const durationNum = parseInt(duration);
		const quizQuestionsNum = parseInt(quizQuestions);
		const totalQuestionsNum = parseInt(totalQuestions);

		if (
			isNaN(durationNum) ||
			durationNum <= 0 ||
			isNaN(quizQuestionsNum) ||
			quizQuestionsNum <= 0 ||
			isNaN(totalQuestionsNum) ||
			totalQuestionsNum <= 0
		) {
			return new Response(
				JSON.stringify({
					success: false,
					message:
						"Duration, quizQuestions, and totalQuestions must be positive numbers",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// Validate each question
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

		// Insert into DB
		const quizDoc = {
			name,
			duration: durationNum,
			quizQuestions: quizQuestionsNum,
			totalQuestions: totalQuestionsNum,
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
		const { correct_options, ...modifiedQuiz } = quiz;

		return new Response(JSON.stringify(modifiedQuiz), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		console.error(err);
		return new Response(JSON.stringify({ message: "Server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function getQuizNames(req: Request): Promise<Response> {
	try {
		const quizzes = await quizzesCollection()
			.find({}, { projection: { name: 1 } })
			.toArray();

		const quizNames = quizzes.map((q) => ({
			id: q._id.toString(),
			name: q.name,
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



// GET /api/server-time
export async function getServerTimeController(req:Request) {
  return new Response(
    JSON.stringify({ serverTime: Date.now() }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// GET /api/quiz-end-time?userId=...
export async function getQuizEndTimeController(req:Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
  }

  try {
    const session = await quizSessionCollection().findOne({ userId });

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }

    const startTime = session.startTime instanceof Date
      ? session.startTime.getTime()
      : session.startTime;

    const durationMinutes = session.durationMinutes;

    const endTime = startTime + durationMinutes * 60 * 1000;

    return new Response(
      JSON.stringify({ endTime }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("DB error", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function startQuizController(req: Request) {
	try {
	  const body = await req.json();
	  const { userId, durationMinutes, quizId } = body;
	  if (!userId || !durationMinutes || !quizId) {
		return new Response(
		  JSON.stringify({ error: "Missing userId, durationMinutes, or quizId" }),
		  { status: 400 }
		);
	  }
  
	  const startTime = Date.now();
  
	  await quizSessionCollection().updateOne(
		{ userId, quizId },
		{ $set: { startTime, durationMinutes } },
		{ upsert: true }
	  );
  
	  return new Response(
		JSON.stringify({ startTime, durationMinutes, quizId }),
		{
		  status: 200,
		  headers: { "Content-Type": "application/json" },
		}
	  );
	} catch (err) {
	  console.error("DB error", err);
	  return new Response(
		JSON.stringify({ error: "Invalid JSON or DB Error" }),
		{ status: 400 }
	  );
	}
  }
  
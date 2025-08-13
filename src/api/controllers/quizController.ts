import { db } from "../db";
const quizzesCollection = () => db!.collection("quizzes");

export async function createQuiz(req: Request) {
	try {
		const body = await req.json();
		const { title, description, questions, duration } = body;

		if (
			!title ||
			!description ||
			!Array.isArray(questions) ||
			questions.length === 0 ||
			!duration
		) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid input - missing required fields",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// Validate duration is a positive number
		const durationNum = parseInt(duration);
		if (isNaN(durationNum) || durationNum <= 0) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Duration must be a positive number",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const quizDoc = {
			title,
			description,
			questions,
			duration: durationNum, // Store as number in minutes
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

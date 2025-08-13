import { db } from "../db";
import {authMiddleware} from "../middlewares/authMiddleware"
const quizzesCollection = () => db!.collection("quizzes");

export async function createQuiz(req: Request) {
	const { unauthorizedResponse } = await authMiddleware(req);
	if (unauthorizedResponse) return unauthorizedResponse;
  
  try {
    const body = await req.json();
    const { name, duration, questions, totalQuestions } = body;

    // Basic validation
    if (
      !name ||
      !Array.isArray(questions) ||
      questions.length === 0 ||
      !duration ||
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

    // Validate duration and totalQuestions as positive numbers
    const durationNum = parseInt(duration);
    const totalQuestionsNum = parseInt(totalQuestions);

    if (
      isNaN(durationNum) || durationNum <= 0 ||
      isNaN(totalQuestionsNum) || totalQuestionsNum <= 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Duration and totalQuestions must be positive numbers",
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
              "Invalid question format - each question must have sno, question text, options array, correct_options array, and multiple boolean",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const quizDoc = {
      name,
      duration: durationNum,
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
	  return new Response(JSON.stringify(quizzes), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	  });
	} catch (error) {
	  console.error("Failed to fetch quizzes:", error);
	  return new Response(
		JSON.stringify({ message: "Failed to fetch quizzes" }),
		{
		  status: 500,
		  headers: { "Content-Type": "application/json" },
		}
	  );
	}
  }
  
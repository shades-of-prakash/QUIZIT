import { ObjectId } from "mongodb";
import { db } from "../db";
import { authMiddleware } from "../middlewares/authMiddleware";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { stringify } from "csv-stringify/sync";
import Papa from "papaparse";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

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

const quizzesCollection = () => db!.collection("quizzes");
const quizSessionCollection = () => db!.collection("quiz-session");
const quizSubmission = () => db!.collection("quiz-submission");
const usersCollection = () => db!.collection<QuizUser>("quiz-users");

function generateUserCredentials(quizName: string, index: number) {
  const initials = quizName
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toLowerCase();

  const username = `${initials}u${index}`;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 4; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return { username, password };
}

const quizUsersCollection = () => db!.collection("quiz-users");

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
      { status: 500, headers: { "Content-Type": "application/json" } },
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
        { status: 400, headers: { "Content-Type": "application/json" } },
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
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: err.message || "Error creating users" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function getSingleQuiz(req: Request) {
  try {
    const body = await req.json();
    const { quizId, page = 1, limit = 5, filterNeedsImage = false, filterHasCode = false } = body;

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

    let stableQuestions = quiz.questions;

    if (filterNeedsImage) {
      stableQuestions = stableQuestions.filter((q: any) => {
        return q.needsImage || q.options.some((o: any) => !o.text && !o.image);
      });
    }

    if (filterHasCode) {
      stableQuestions = stableQuestions.filter((q: any) => {
        return q.question && q.question.includes('```');
      });
    }

    const totalQuestions = stableQuestions.length;

    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedQuestions = stableQuestions.slice(start, end);

    const totalPages = Math.ceil(totalQuestions / limit);

    const { questions, correct_options, ...quizMeta } = quiz;

    return new Response(
      JSON.stringify({
        ...quizMeta,
        questions: paginatedQuestions,
        pagination: {
          page,
          limit,
          totalQuestions,
          totalPages,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
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
    const quizzes = await quizzesCollection().find({}).toArray();

    const quizNames = quizzes.map((q) => ({
      id: q._id.toString(),
      name: q.name,
      teamSize: q.teamSize,
      duration: q.duration,
      quizQuestions: q.quizQuestions,
    }));

    return new Response(JSON.stringify({ success: true, data: quizNames }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching quiz names:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
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
        { status: 400, headers: { "Content-Type": "application/json" } },
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
        (q: any) => !Array.isArray(q.user_options),
      );

      if (needsUpdate) {
        await quizSessionCollection().updateOne(
          { _id: existingSession._id },
          { $set: { questions } },
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
        tabSwitchCount: 0,
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
        tabSwitchCount: existingSession?.tabSwitchCount ?? 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
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
      { status: 200, headers: { "Content-Type": "application/json" } },
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
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    await quizSessionCollection().updateOne(
      { userId, quizId },
      {
        $set: {
          remainingSeconds: Math.max(0, remainingSeconds),
          lastUpdated: Date.now(),
        },
      },
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
      },
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
    console.debug("Request body:", body);

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
      console.debug("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const now = Date.now();

    console.debug("Looking for active quiz session...");
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
      { returnDocument: "after" },
    );

    if (!session) {
      console.debug("No active session found or already submitted");
      return new Response(
        JSON.stringify({ error: "Quiz already submitted or expired" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!Array.isArray(session.questions) || session.questions.length === 0) {
      console.debug("Session has no questions");
      return new Response(
        JSON.stringify({ error: "No questions found in session" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch duration directly from quizzes collection
    console.debug("Fetching quiz duration from quizzes collection...");
    const quiz = await quizzesCollection().findOne({
      _id: ObjectId.createFromHexString(quizId),
    });
    const durationMinutes = quiz?.duration || 0;
    console.debug("Quiz duration (minutes):", durationMinutes);
    console.log("session remainingSeconds", session.remainingSeconds);
    const remaining = Math.max(Number(session.remainingSeconds || 0), 0);
    const totalSeconds = durationMinutes * 60;
    const consumedSeconds = Math.max(totalSeconds - remaining, 0);
    const minutes = Math.floor(consumedSeconds / 60);
    const seconds = consumedSeconds % 60;
    const timeConsumed = `${minutes}m ${seconds}s`;

    console.debug("Time calculation details:", {
      remainingSeconds: remaining,
      totalSeconds,
      consumedSeconds,
      minutes,
      seconds,
    });
    console.debug("Time consumed:", timeConsumed);

    // Prepare submission data
    const submissionData: Record<string, any> = {
      userId,
      quizId,
      questions: session.questions,
      participant1Name: participant1Name.trim(),
      participant1RollNo: participant1RollNo.trim(),
      email: email?.trim() || null,
      submittedAt: now,
      timeConsumed,
    };

    if (participant2Name?.trim())
      submissionData.participant2Name = participant2Name.trim();
    if (participant2RollNo?.trim())
      submissionData.participant2RollNo = participant2RollNo.trim();

    console.debug("Updating submission in DB:", submissionData);
    await quizSubmission().updateOne(
      { userId, quizId },
      { $set: submissionData },
      { upsert: true },
    );

    // Update approval request status to COMPLETED
    try {
      const db = require("../db").db;
      if (db) {
        await db.collection("approval_requests").updateOne(
          { quizId, participant1RollNo: participant1RollNo.trim() },
          { $set: { status: "COMPLETED" } }
        );
      }
    } catch (dbErr) {
      console.error("Failed to update approval request status:", dbErr);
    }

    console.debug(
      "Quiz submitted successfully for user:",
      userId,
      "quiz:",
      quizId,
    );
    return new Response(
      JSON.stringify({ message: "Quiz submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
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
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ensure session exists
    const session = await quizSessionCollection().findOne({ userId, quizId });
    if (!session) {
      return new Response(
        JSON.stringify({ error: "No active quiz session found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const updates: any = { lastUpdated: Date.now() };

    if (questions !== undefined) updates.questions = questions;
    if (activeQuestion !== undefined) updates.activeQuestion = activeQuestion;
    if (skippedQuestions !== undefined)
      updates.skippedQuestions = skippedQuestions;

    await quizSessionCollection().updateOne(
      { userId, quizId },
      { $set: updates },
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

export async function deleteQuizController(req: Request) {
  const { unauthorizedResponse } = await authMiddleware(req);
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const url = new URL(req.url);
    const quizId = url.searchParams.get("quizId");

    if (!quizId) {
      return new Response(JSON.stringify({ error: "quizId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const _id = ObjectId.createFromHexString(quizId);

    /* ---------------- Fetch Quiz First ---------------- */

    const quiz = await quizzesCollection().findOne({ _id });

    if (!quiz) {
      return new Response(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    /* ---------------- Delete Image Folder ---------------- */

    const quizFolder = safeFolderName(quiz.name);
    const imagesDir = path.join(process.cwd(), "public", "uploads", quizFolder);

    if (fs.existsSync(imagesDir)) {
      fs.rmSync(imagesDir, {
        recursive: true,
        force: true,
      });
    }

    /* ---------------- Delete Quiz & Related Data ---------------- */

    await quizzesCollection().deleteOne({ _id });

    await usersCollection().deleteMany({ quizId });
    await quizSessionCollection().deleteMany({ quizId });
    await quizSubmission().deleteMany({ quizId });

    try {
      const db = require("../db").db;
      if (db) {
        await db.collection("approval_requests").deleteMany({ quizId });
      }
    } catch (e) {
      console.error("Failed to delete approval requests:", e);
    }

    return new Response(
      JSON.stringify({
        message: `Quiz "${quiz.name}" and all related data deleted successfully.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Delete quiz error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete quiz data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
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
        { status: 400 },
      );
    }

    const session = await quizSessionCollection().findOne({ userId, quizId });

    if (!session) {
      return new Response(
        JSON.stringify({ error: "No active session found" }),
        { status: 404 },
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
        tabSwitchCount: session.tabSwitchCount ?? 0,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Error fetching session:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function getQuizResultsController(req: Request) {
  try {
    const url = new URL(req.url);
    const quizId = url.searchParams.get("quizId");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    if (!quizId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing quizId" }),
        { status: 400 },
      );
    }

    const quiz = await quizzesCollection().findOne({
      _id: ObjectId.createFromHexString(quizId),
    });
    if (!quiz || !quiz.questions) {
      return new Response(
        JSON.stringify({ success: false, error: "Quiz not found" }),
        { status: 404 },
      );
    }

    const skip = (page - 1) * limit;

    const submissions = await quizSubmission()
      .find({ quizId, submittedAt: { $exists: true, $ne: null } })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await quizSubmission().countDocuments({
      quizId,
      submittedAt: { $exists: true, $ne: null },
    });

    // Map quiz questions by sno for faster lookup
    const quizQuestionsMap: Record<string, any> = {};
    quiz.questions.forEach((q: any) => {
      quizQuestionsMap[q.sno] = q;
    });

    const results = submissions.map((submission: any) => {
      let score = 0;

      if (Array.isArray(submission.questions)) {
        for (const userQuestion of submission.questions) {
          const sno = userQuestion.sno;
          const userAnswer = userQuestion.user_options || [];

          const quizQuestion = quizQuestionsMap[sno];
          if (!quizQuestion) continue;

          const correct = Array.isArray(quizQuestion.correct_options)
            ? quizQuestion.correct_options
            : [quizQuestion.correct_options];

          const isCorrect =
            userAnswer.length === correct.length &&
            userAnswer.every((val: number) => correct.includes(val));

          if (isCorrect) score++;
        }
      }

      let submittedAtFormatted = null;
      if (submission.submittedAt) {
        const timestamp = Number(submission.submittedAt);
        submittedAtFormatted = new Date(timestamp).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
      }

      return {
        userId: submission.userId,
        email: submission.email || "N/A",
        participant1Name: submission.participant1Name,
        participant1RollNo: submission.participant1RollNo,
        participant2Name: submission.participant2Name || null,
        participant2RollNo: submission.participant2RollNo || null,
        score,
        submittedAt: submission.submittedAt,
        submittedAtFormatted,
        timeConsumedFormatted: submission.timeConsumed || null,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Get quiz results error", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 },
    );
  }
}

export async function downloadQuizResultsController(req: Request) {
  try {
    const url = new URL(req.url);
    const quizId = url.searchParams.get("quizId");

    if (!quizId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing quizId" }),
        { status: 400 },
      );
    }

    const quiz = await quizzesCollection().findOne({
      _id: new ObjectId(quizId),
    });

    if (!quiz) {
      return new Response(
        JSON.stringify({ success: false, error: "Quiz not found" }),
        { status: 404 },
      );
    }

    const submissions = await quizSubmission()
      .find({ quizId, submittedAt: { $exists: true, $ne: null } })
      .toArray();

    // Map questions for score calculation
    const quizQuestionsMap: Record<string, any> = {};
    quiz.questions.forEach((q: any) => {
      quizQuestionsMap[q.sno] = q;
    });

    const rows = [];
    for (const submission of submissions) {
      const user = await usersCollection().findOne({
        _id: ObjectId.createFromHexString(submission.userId),
        quizId: submission.quizId,
      });

      let score = 0;
      if (submission.questions && Array.isArray(submission.questions)) {
        submission.questions.forEach((userQuestion: any) => {
          const sno = userQuestion.sno;
          const userAnswer = userQuestion.user_options || [];
          const quizQuestion = quizQuestionsMap[sno];
          if (!quizQuestion) return;

          const correct = Array.isArray(quizQuestion.correct_options)
            ? quizQuestion.correct_options
            : [quizQuestion.correct_options];

          const isCorrect =
            userAnswer.length === correct.length &&
            userAnswer.every((val: number) => correct.includes(val));

          if (isCorrect) score++;
        });
      }

      const submittedAtFormatted = submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleString()
        : "N/A";

      const timeConsumed = submission.timeConsumed || "N/A";

      rows.push({
        Participant1Name: user?.participant1Name || "",
        Participant1RollNo: user?.participant1RollNo || "",
        Participant2Name: user?.participant2Name || "",
        Participant2RollNo: user?.participant2RollNo || "",
        Email: user?.email || "N/A",
        PhoneNumber: user?.phoneNumber || "N/A",
        CollegeName: user?.collegeName || "N/A",
        Score: score,
        SubmittedAt: submittedAtFormatted,
        TimeConsumed: timeConsumed,
      });
    }

    const csv = stringify(rows, { header: true });

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="quiz_${quizId}_results.csv"`,
      },
    });
  } catch (err) {
    console.error("Download quiz results error", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 },
    );
  }
}

export async function updateTabSwitchCountController(req: Request) {
  try {
    const body = await req.json();
    const { userId, quizId } = body;

    if (!userId || !quizId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or quizId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const session = await quizSessionCollection().findOne({ userId, quizId });

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newCount = (session.tabSwitchCount || 0) + 1;

    await quizSessionCollection().updateOne(
      { userId, quizId },
      { $set: { tabSwitchCount: newCount, lastUpdated: Date.now() } },
    );

    return new Response(
      JSON.stringify({ success: true, tabSwitchCount: newCount }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("DB error updating tabSwitchCount", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function createQuiz(req: Request) {
  const { unauthorizedResponse } = await authMiddleware(req);
  if (unauthorizedResponse) return unauthorizedResponse;

  let outputDir: string | null = null;

  try {
    /* ---------------- Parse multipart ---------------- */

    const formData = await req.formData();

    const csvFile = formData.get("csv") as File | null;

    const name = formData.get("name")?.toString().trim();
    const duration = Number(formData.get("duration"));
    const quizQuestions = Number(formData.get("quizQuestions"));
    const teamSize = Number(formData.get("teamSize"));

    if (!csvFile || !name || !duration || !quizQuestions || !teamSize) {
      return jsonError("Missing required fields", 400);
    }

    if (![1, 2].includes(teamSize)) {
      return jsonError("Team size must be 1 or 2", 400);
    }

    /* ---------------- Duplicate Quiz Name Check ---------------- */

    const existingQuiz = await quizzesCollection().findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingQuiz) {
      return jsonError(`Quiz with name "${name}" already exists`, 409);
    }

    /* ---------------- Parse CSV ---------------- */

    const csvText = await csvFile.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors.length) {
      return jsonError(parsed.errors[0].message, 400);
    }

    const rows = parsed.data as any[];

    if (!rows.length) {
      return jsonError("CSV must contain at least one question", 400);
    }

    /* ---------------- Validate Headers ---------------- */

    const REQUIRED_HEADERS = [
      "sno",
      "question",
      "option1",
      "option2",
      "option3",
      "option4",
      "multiple",
      "correct-options",
      "images",
    ];

    for (const h of REQUIRED_HEADERS) {
      if (!(h in rows[0])) {
        return jsonError(`Missing column: ${h}`, 400);
      }
    }

    /* ---------------- Build Questions ---------------- */

    const questions = rows.map((row, i) => {
      const rowNo = i + 2;

      let questionText = row["question"]?.trim();

      if (!questionText) {
        throw new Error(
          `Row ${rowNo}: question text required`,
        );
      }

      const content = (row["codeContent"] || "").trim();
      if (content) {
        const lang = (row["codeLang"] || "plaintext").trim();
        questionText += `\n\`\`\`${lang}\n${content}\n\`\`\``;
      }

      const hasImages = String(row["images"]).trim() === "1" || String(row["images"]).trim().toLowerCase() === "true";

      const options = [1, 2, 3, 4]
        .map((n) => {
          const text = row[`option${n}`]?.trim();

          if (!text && !hasImages) return null;

          return {
            text: text || null,
            image: null,
          };
        })
        .filter(Boolean);

      if (options.length < 2) {
        throw new Error(`Row ${rowNo}: at least two options required (empty options only allowed if images=1)`);
      }

      const multiple = String(row["multiple"]).toLowerCase() === "true";

      const correct = row["correct-options"]
        .split("|")
        .map((v: string) => Number(v) - 1);

      if (!multiple && correct.length !== 1) {
        throw new Error(
          `Row ${rowNo}: multiple=false allows only one correct option`,
        );
      }

      return {
        sno: row["sno"],
        question: questionText || null,
        questionImage: null,
        options,
        correct_options: correct,
        multiple,
        needsImage: hasImages,
      };
    });

    if (quizQuestions > questions.length) {
      return jsonError(
        `quizQuestions (${quizQuestions}) cannot exceed total questions (${questions.length})`,
        400,
      );
    }

    /* ---------------- Persist Quiz ---------------- */

    await quizzesCollection().insertOne({
      name,
      duration,
      quizQuestions,
      totalQuestions: questions.length,
      teamSize,
      questions,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Quiz created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    if (err.code === 11000) {
      return jsonError("Quiz name already exists", 409);
    }

    if (outputDir && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    console.error("Create quiz error:", err);
    return jsonError(err.message || "Server error", 500);
  }
}

/* ---------------- Helpers ---------------- */

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeFolderName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/gi, "_");
}

export async function updateQuizQuestion(req: Request) {
  try {
    const body = await req.json();

    const {
      quizId,
      sno,
      question,
      questionImage = null,
      options,
      correct_options,
      multiple,
    } = body;

    if (!quizId || !sno) {
      return new Response(
        JSON.stringify({ message: "quizId and sno are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!question || !Array.isArray(options) || options.length === 0) {
      return new Response(
        JSON.stringify({ message: "Invalid question payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const quizObjectId = ObjectId.createFromHexString(quizId);

    const updateResult = await quizzesCollection().findOneAndUpdate(
      {
        _id: quizObjectId,
        "questions.sno": String(sno),
      },
      {
        $set: {
          "questions.$.question": question,
          "questions.$.questionImage": questionImage,
          "questions.$.options": options,
          "questions.$.correct_options": correct_options || [],
          "questions.$.multiple": Boolean(multiple),
          "questions.$.updatedAt": new Date(),
        },
      },
      {
        returnDocument: "after",
        projection: {
          questions: { $elemMatch: { sno: String(sno) } },
        },
      },
    );

    const updatedDocument = updateResult?.value || updateResult;
    
    if (!updatedDocument) {
      return new Response(JSON.stringify({ message: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Question updated successfully",
        question: updatedDocument.questions[0],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("updateQuizQuestion error:", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function uploadImageController(req: Request) {
  const { unauthorizedResponse } = await authMiddleware(req);
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const quizId = formData.get("quizId")?.toString().trim();

    if (!imageFile || !quizId) {
      return jsonError("Missing image or quizId", 400);
    }

    const quiz = await quizzesCollection().findOne({
      _id: ObjectId.createFromHexString(quizId),
    });

    if (!quiz) {
      return jsonError("Quiz not found", 404);
    }

    const quizFolder = safeFolderName(quiz.name);
    const outputDir = path.join(process.cwd(), "public", "uploads", quizFolder);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const cleanName = imageFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileName = `${Date.now()}-${cleanName}`;
    const filePath = path.join(outputDir, fileName);

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `/uploads/${quizFolder}/${fileName}`;

    return new Response(
      JSON.stringify({ success: true, imageUrl }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Upload image error:", err);
    return jsonError(err.message || "Server error", 500);
  }
}

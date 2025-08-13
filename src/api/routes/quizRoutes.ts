import { createQuiz } from "../controllers/quizController";

export const quizRoutes = {
	"/api/create-quiz": {
		POST: createQuiz,
	},
};

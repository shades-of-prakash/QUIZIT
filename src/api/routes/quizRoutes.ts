import { createQuiz } from "../controllers/quizController";
import { getAllQuizzes } from "../controllers/quizController";
export const quizRoutes = {
	"/api/create-quiz": {
		POST: createQuiz,
	},
	"/api/getquizzes": {
		GET:getAllQuizzes
	}
};

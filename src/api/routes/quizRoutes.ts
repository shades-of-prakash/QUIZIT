import {
	createQuiz,
	createQuizUsers,
	getAllQuizzes,
	getQuizNames,
	getSingleQuiz,
} from "../controllers/quizController";

export const quizRoutes = {
	"/api/create-quiz": {
		POST: createQuiz,
	},
	"/api/getquizzes": {
		GET: getAllQuizzes,
	},
	"/api/create-quiz-users": {
		POST: createQuizUsers,
	},
	"/api/quizdetails": {
		POST: getSingleQuiz,
	},
	"/api/quiznames": {
		GET: getQuizNames,
	},
};

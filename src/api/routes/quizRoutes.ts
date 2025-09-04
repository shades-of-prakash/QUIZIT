import {
	createQuiz,
	createQuizUsers,
	getAllQuizzes,
	getQuizNames,
	updateQuizSessionController,
	getSingleQuiz,
	// getQuizEndTimeController,
	createQuizSessionController,
	submitQuizController,
	checkSessionController,
	getQuizResultsController,
	deleteQuizController,
	getQuizRemainingTimeController,
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

	// "/api/server-time": {
	// 	GET: getServerTimeController,
	// },
	// "/api/quiz-end-time": {
	// 	GET: getQuizEndTimeController,
	// },
	"/api/quiz-session": {
		POST: createQuizSessionController,
	},
	"/api/submit-quiz": {
		POST: submitQuizController,
	},
	"/api/check-session": {
		POST: checkSessionController,
	},
	"/api/results": {
		GET: getQuizResultsController,
	},
	"/api/deletequiz": {
		GET: deleteQuizController,
	},
	"/api/quiz-remaining-time": {
		GET: getQuizRemainingTimeController,
	},

	"/api/quiz-session-update": {
		POST: updateQuizSessionController,
	},
};

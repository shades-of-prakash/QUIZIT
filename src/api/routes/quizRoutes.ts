import {
	createQuiz,
	createQuizUsers,
	getAllQuizzes,
	getQuizNames,
	updateQuizSessionController,
	getSingleQuiz,
	saveSessionStateController,
	createQuizSessionController,
	submitQuizController,
	checkSessionController,
	getQuizResultsController,
	deleteQuizController,
	getQuizRemainingTimeController,
	getSessionController,
	downloadQuizResultsController,
	updateTabSwitchCountController
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

	"/api/create-quiz-session": {
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

	"/api/results/download": {
		GET: downloadQuizResultsController,
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
	"/api/save-session-state": {
		POST: saveSessionStateController,
	},
	"/api/get-session": {
		GET: getSessionController,
	},
	"/api/update-tab-switch-count":{
		POST:updateTabSwitchCountController,
	}
};

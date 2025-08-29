import {
	createQuiz,
	createQuizUsers,
	getAllQuizzes,
	getQuizNames,
	getServerTimeController,
	getSingleQuiz,
	startQuizController,
	getQuizEndTimeController
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
	
	"/api/server-time":{
		GET:getServerTimeController
	},
	"/api/quiz-end-time": {
		GET: getQuizEndTimeController,
	},
	"/api/start-quiz": {
		POST: startQuizController,
	}
};

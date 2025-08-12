import { login, getUser } from "../controllers/authController";

export const authRoutes = {
	"/api/user": {
		POST: getUser,
	},
	"/api/login": {
		POST: login,
	},
};

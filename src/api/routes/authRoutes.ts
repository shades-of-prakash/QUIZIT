import { login, getUser } from "../controllers/authController";

export const authRoutes = {
	"/api/user": {
		GET: getUser,
	},
	"/api/login": {
		POST: login,
	},
};

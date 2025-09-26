import { login, getUser, logout } from "../controllers/authController";

export const authRoutes = {
	"/api/user": {
		GET: getUser,
	},
	"/api/login": {
		POST: login,
	},
	"/api/admin-logout": {
		POST: logout,
	},
};

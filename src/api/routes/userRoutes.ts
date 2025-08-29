import { getCurrentUser, userLogin } from "../controllers/userAuthController";
export const userRoutes = {
	"/api/userlogin": {
		POST: userLogin,
	},
	"/api/me": {
		GET: getCurrentUser,
	},
};

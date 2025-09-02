import {
	getCurrentUser,
	userLogin,
	userLogout,
} from "../controllers/userAuthController";
export const userRoutes = {
	"/api/userlogin": {
		POST: userLogin,
	},
	"/api/me": {
		GET: getCurrentUser,
	},
	"/api/userlogout": {
		POST: userLogout,
	},
};

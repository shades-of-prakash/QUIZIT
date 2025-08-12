// api/routes/helloRoutes.ts

import { getHello, putHello, helloName } from "../controllers/helloController";

export const Routes = {
	"/api/hello": {
		GET: getHello,
		PUT: putHello,
	},
	"/api/hello/:name": helloName,
};

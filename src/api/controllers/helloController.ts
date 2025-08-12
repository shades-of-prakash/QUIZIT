// api/controllers/helloController.ts

import { db } from "../db";

export async function getHello(req: Request) {
	// Example MongoDB usage if db connected
	// const count = await db.collection("test").countDocuments();

	return Response.json({
		message: "Hello, world!",
		method: "GET",
		// documentCount: count,
	});
}

export async function putHello(req: Request) {
	return Response.json({
		message: "Hello, world!",
		method: "PUT",
	});
}

export async function helloName(req: Request) {
	const name = req.params.name;
	return Response.json({
		message: `Hello, ${name}!`,
	});
}

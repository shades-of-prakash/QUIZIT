import mongoose from "mongoose";

const uri = Bun.env.MONGODB_URI || "";
export let db: mongoose.mongo.Db;

export async function connectDB() {
	try {
		await mongoose.connect(uri, {
			maxPoolSize: 100,
			minPoolSize: 5,
			serverSelectionTimeoutMS: 5000,
		});

		db = mongoose.connection.getClient().db("QUIZIT");
		console.log("MongoDB connected to QUIZIT database");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		throw error;
	}
}

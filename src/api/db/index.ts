import { MongoClient } from "mongodb";
const uri =
	"mongodb+srv://admin:quizitrvrjc1985@quizit.ol15itk.mongodb.net/?retryWrites=true&w=majority&appName=quizit";
const client = new MongoClient(uri);

export let db: null | ReturnType<MongoClient["db"]> = null;

export async function connectDB() {
	try {
		await client.connect();
		db = client.db("QUIZIT");
		console.log("MongoDB Atlas connected");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		throw error;
	}
}

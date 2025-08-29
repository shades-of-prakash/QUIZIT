import mongoose from "mongoose";

const uri =Bun.env.MONGODB_URI || ""

export let db: null | mongoose.mongo.Db = null;

export async function connectDB() {
  try {
    await mongoose.connect(uri);
    db = mongoose.connection.getClient().db("QUIZIT");
    console.log("MongoDB Atlas connected to QUIZIT database");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

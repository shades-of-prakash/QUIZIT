import mongoose from "mongoose";

const uri =
  "mongodb+srv://admin:quizitrvrjc1985@quizit.ol15itk.mongodb.net/?retryWrites=true&w=majority&appName=quizitssl=true&authSource=admin";

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

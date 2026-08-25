import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = Bun.env.MONGODB_URI || "mongodb://localhost:27017/QUIZIT";
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

    // Seed default admin user
    const adminCollection = db.collection("admin");
    const adminExists = await adminCollection.findOne({ username: "prakash" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("snehal@344", 10);
      await adminCollection.insertOne({
        username: "prakash",
        password: hashedPassword,
        createdAt: new Date(),
      });
      console.log("Default admin created: prakash");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

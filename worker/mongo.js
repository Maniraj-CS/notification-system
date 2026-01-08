import mongoose from "mongoose";

await mongoose.connect("mongodb://localhost:27017/notifications");

console.log("database connected successfully")

const logSchema = new mongoose.Schema({
  userId: String,
  email: String,
  message: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

export const Log = mongoose.model("Log", logSchema);

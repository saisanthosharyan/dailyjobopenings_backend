const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing DB connection");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    isConnected = true;
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // crash if DB fails
  }
};

module.exports = connectDB;
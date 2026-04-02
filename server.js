require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const jobRoutes = require("./routes/jobRoutes");
const jobAlertRoutes = require("./routes/jobalertroutes");

// ✅ Cron job (works in Render)
require("./cron/jobstatusupdater");

const app = express();

/* =========================
   ✅ SECURITY MIDDLEWARE
========================= */

// Secure HTTP headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* =========================
   ✅ CORS CONFIGURATION
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",")
    : []),
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / mobile apps

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

/* =========================
   ✅ MIDDLEWARE
========================= */

app.use(express.json());

/* =========================
   ✅ DATABASE CONNECTION
========================= */

connectDB();

/* =========================
   ✅ ROUTES
========================= */

app.use("/api", jobRoutes);
app.use("/api/job-alerts", jobAlertRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Daily Job Openings API Running 🚀");
});

// Health Check (important for Render)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* =========================
   ✅ GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   ✅ SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
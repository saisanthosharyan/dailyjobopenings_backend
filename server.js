require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const connectDB = require("./config/db");
const jobRoutes = require("./routes/jobRoutes");
const jobAlertRoutes = require("./routes/jobalertroutes");
const resourceRoutes = require("./routes/resourceRoutes").default;
const interviewRoutes = require("./routes/interviewroutes").default;
const adminRoutes = require("./routes/adminroutes");

// ✅ Cron job (works in Render)
require("./cron/jobstatusupdater");

const app = express();

/* =========================
   ✅ SECURITY MIDDLEWARE
========================= */

// Secure HTTP headers
app.use(helmet());

/* =========================
   ✅ RATE LIMITING (NEW)
========================= */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP
  message: "Too many requests, please try again later",
});

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
      if (!origin) return callback(null, true);

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

// ✅ JSON LIMIT (NEW)
app.use(express.json({ limit: "10kb" }));

// Logging (only dev)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* =========================
   ✅ APPLY RATE LIMIT TO API (NEW)
========================= */

app.use("/api", apiLimiter);

/* =========================
   ✅ DATABASE CONNECTION
========================= */

connectDB();

/* =========================
   ✅ ROUTES
========================= */

app.use("/api", jobRoutes);
app.use("/api/job-alerts", jobAlertRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/interview-ques", interviewRoutes);
app.use("/api/admin", adminRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Daily Job Openings API Running 🚀");
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* =========================
   ✅ GLOBAL ERROR HANDLER (FIXED)
========================= */

const isProd = process.env.NODE_ENV === "production";

app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: isProd
      ? "Something went wrong"
      : err.message,
  });
});
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

/* =========================
   ✅ SERVER START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
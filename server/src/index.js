const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Default avatar - using a redirect to a default image from an external source
// This way we don't need to store the image locally
app.get("/uploads/default-avatar.png", (req, res) => {
  res.redirect(
    "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=128"
  );
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/room", require("./routes/room"));

// Home route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Clarity Connect API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

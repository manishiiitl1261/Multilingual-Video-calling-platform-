const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const roomController = require("../controllers/room");

// Test route for development - doesn't require auth
router.get("/test-token", roomController.generateTestToken);

// All other routes require authentication
router.use(protect);

// Create a new room
router.post("/create", roomController.createRoom);

// Generate a token for joining a room
router.get("/token", roomController.generateToken);

// End a room (host only)
router.post("/end", roomController.endRoom);

// Join an existing room
router.post("/join/:roomId", roomController.joinRoom);

// Get active rooms (for testing/admin purposes)
router.get("/active", roomController.getActiveRooms);

module.exports = router;

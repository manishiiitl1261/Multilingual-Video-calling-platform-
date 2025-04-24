const { AccessToken, RoomServiceClient } = require("livekit-server-sdk");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

// In a real app, you would store rooms in a database
const activeRooms = new Map();

// Environment variables for LiveKit (should be properly secured)
const API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const API_SECRET = process.env.LIVEKIT_API_SECRET || "devsecret";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://your-livekit-server.com";

console.log("LiveKit configuration:", {
  API_KEY: API_KEY,
  SECRET_LENGTH: API_SECRET ? API_SECRET.length : 0,
  URL: LIVEKIT_URL,
});

/**
 * Generate a test token - for development only
 */
exports.generateTestToken = async (req, res) => {
  try {
    const { roomId, username } = req.query;

    if (!roomId || !username) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    console.log(
      `Generating test token for room: ${roomId} and user: ${username}`
    );
    console.log("API_KEY:", API_KEY);
    console.log("API_SECRET length:", API_SECRET ? API_SECRET.length : 0);

    // Direct JWT generation - avoiding LiveKit's toJwt() method that might be broken in this version
    try {
      // Create JWT payload
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 24 * 60 * 60; // 24 hours from now

      const payload = {
        iss: API_KEY,
        sub: username,
        jti: `${username}-${Date.now()}`,
        exp: exp,
        nbf: now,
        video: {
          roomJoin: true,
          room: roomId,
          canPublish: true,
          canSubscribe: true,
        },
      };

      console.log("JWT payload created:", JSON.stringify(payload));

      // Sign the JWT with the API secret
      const jwtToken = jwt.sign(payload, API_SECRET);

      console.log("JWT token generated, type:", typeof jwtToken);
      console.log("Token length:", jwtToken ? jwtToken.length : 0);

      if (typeof jwtToken !== "string" || !jwtToken) {
        throw new Error("Generated test token is not a valid string");
      }

      return res.status(200).json({
        success: true,
        message: "Test token generated successfully",
        data: {
          token: jwtToken,
        },
      });
    } catch (tokenError) {
      console.error(
        "Failed to generate test token using JWT method:",
        tokenError
      );

      // Final fallback to hardcoded pattern if everything else fails
      try {
        console.log("Trying fallback test token generation");

        // Create a simple JWT with hardcoded structure but proper values
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 24 * 60 * 60; // 24 hours

        const payload = {
          iss: API_KEY,
          sub: username,
          exp: exp,
          nbf: now,
          video: {
            roomJoin: true,
            room: roomId,
            canPublish: true,
            canSubscribe: true,
          },
        };

        const hardcodedToken = jwt.sign(payload, API_SECRET);

        console.log(
          "Fallback test token generated, type:",
          typeof hardcodedToken
        );

        if (typeof hardcodedToken === "string" && hardcodedToken.length > 20) {
          return res.status(200).json({
            success: true,
            message: "Test token generated (fallback method)",
            data: {
              token: hardcodedToken,
            },
          });
        } else {
          throw new Error("Fallback test token generation failed");
        }
      } catch (fallbackError) {
        console.error("Fallback test token generation failed:", fallbackError);
        return res.status(500).json({
          success: false,
          message: `Failed to generate test token after all attempts: ${tokenError.message}`,
        });
      }
    }
  } catch (error) {
    console.error("Error generating test token:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to generate test token: ${error.message}`,
    });
  }
};

/**
 * Create a new room and return its ID
 */
exports.createRoom = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const roomId = uuidv4().substring(0, 8); // Generate a shorter room ID

    // Store room information
    activeRooms.set(roomId, {
      id: roomId,
      host: userId,
      participants: [userId],
      createdAt: new Date(),
    });

    // Initialize LiveKit room (optional, as LiveKit creates rooms automatically)
    const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);
    await roomService.createRoom({
      name: roomId,
      emptyTimeout: 60 * 10, // 10 minutes
      maxParticipants: 100,
    });

    return res.status(201).json({
      success: true,
      data: { roomId },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create room: " + error.message,
    });
  }
};

/**
 * Generate a token for joining a room
 */
exports.generateToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { roomId, username } = req.query;

    if (!roomId || !username) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    console.log(`Generating token for room: ${roomId} and user: ${username}`);
    console.log("API_KEY:", API_KEY);
    console.log("API_SECRET length:", API_SECRET ? API_SECRET.length : 0);

    // Direct JWT generation - avoiding LiveKit's toJwt() method that might be broken in this version
    try {
      // Create JWT payload
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 6 * 60 * 60; // 6 hours from now

      const payload = {
        iss: API_KEY,
        sub: username,
        jti: `${username}-${Date.now()}`,
        exp: exp,
        nbf: now,
        video: {
          roomJoin: true,
          room: roomId,
          canPublish: true,
          canSubscribe: true,
        },
      };

      console.log("JWT payload created:", JSON.stringify(payload));

      // Sign the JWT with the API secret
      const jwtToken = jwt.sign(payload, API_SECRET);

      console.log("JWT token generated, type:", typeof jwtToken);
      console.log("Token length:", jwtToken ? jwtToken.length : 0);

      if (typeof jwtToken !== "string" || !jwtToken) {
        throw new Error("Generated token is not a valid string");
      }

      return res.status(200).json({
        success: true,
        message: "Token generated successfully",
        data: {
          token: jwtToken,
        },
      });
    } catch (tokenError) {
      console.error("Failed to generate token using JWT method:", tokenError);

      // Final fallback to hardcoded pattern if everything else fails
      try {
        console.log("Trying fallback token generation");

        // Create a simple JWT with hardcoded structure but proper values
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 6 * 60 * 60; // 6 hours

        const payload = {
          iss: API_KEY,
          sub: username,
          exp: exp,
          nbf: now,
          video: {
            roomJoin: true,
            room: roomId,
            canPublish: true,
            canSubscribe: true,
          },
        };

        const hardcodedToken = jwt.sign(payload, API_SECRET);

        console.log("Fallback token generated, type:", typeof hardcodedToken);

        if (typeof hardcodedToken === "string" && hardcodedToken.length > 20) {
          return res.status(200).json({
            success: true,
            message: "Token generated (fallback method)",
            data: {
              token: hardcodedToken,
            },
          });
        } else {
          throw new Error("Fallback token generation failed");
        }
      } catch (fallbackError) {
        console.error("Fallback token generation failed:", fallbackError);
        return res.status(500).json({
          success: false,
          message: `Failed to generate token after all attempts: ${tokenError.message}`,
        });
      }
    }
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to generate token: ${error.message}`,
    });
  }
};

/**
 * End a room (host only)
 */
exports.endRoom = async (req, res) => {
  try {
    const { roomId } = req.query;
    const userId = req.user._id.toString();

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    // Check if room exists and user is the host
    const room = activeRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.host !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the host can end the room",
      });
    }

    // Delete room from LiveKit
    const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);
    await roomService.deleteRoom(roomId);

    // Remove room from our tracking
    activeRooms.delete(roomId);

    return res.status(200).json({
      success: true,
      message: "Room ended successfully",
    });
  } catch (error) {
    console.error("Error ending room:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to end room: " + error.message,
    });
  }
};

/**
 * Join an existing room
 */
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id.toString();

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room ID is required",
      });
    }

    // Check if room exists
    const room = activeRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found or has ended",
      });
    }

    // Add user to participants if not already present
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
    }

    return res.status(200).json({
      success: true,
      data: {
        roomId,
        isHost: room.host === userId,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join room: " + error.message,
    });
  }
};

/**
 * Get active rooms (for testing/admin purposes)
 */
exports.getActiveRooms = async (req, res) => {
  try {
    const rooms = Array.from(activeRooms.values()).map((room) => ({
      id: room.id,
      participantCount: room.participants.length,
      createdAt: room.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: { rooms },
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rooms: " + error.message,
    });
  }
};

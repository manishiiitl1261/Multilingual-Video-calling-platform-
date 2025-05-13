/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Room, RoomOptions, LocalParticipant } from "livekit-client";
import { RoomEvent, ConnectionState } from "livekit-client";
export default function TestLiveKit() {
  const [status, setStatus] = useState<string>("Not connected");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [participant, setParticipant] = useState<LocalParticipant | null>(null);
  const [token, setToken] = useState<string>("");
  const [room, setRoom] = useState<Room | null>(null);
  const [tokenDetails, setTokenDetails] = useState<string>("");

  const fetchTestToken = async () => {
    try {
      setStatus("Fetching token...");
      setError(null);

      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const testRoom = "test-room-" + Math.floor(Math.random() * 1000);
      const testUser = "test-user-" + Math.floor(Math.random() * 1000);

      console.log("Fetching test token from:", apiUrl);

      const response = await fetch(
        `${apiUrl}/api/room/test-token?roomId=${testRoom}&username=${testUser}`
      );

      const data = await response.json();
      console.log("Test token response:", data);

      if (!response.ok) {
        throw new Error(
          `Failed to get test token: ${data.message || response.statusText}`
        );
      }

      if (data.success && data.data.token) {
        const receivedToken = data.data.token;

        // Validate token is a string
        if (typeof receivedToken !== "string") {
          throw new Error(
            `Received token is not a string: ${typeof receivedToken}`
          );
        }

        if (receivedToken.length < 10) {
          throw new Error(`Token is too short: ${receivedToken.length} chars`);
        }

        console.log(
          "Token received, type:",
          typeof receivedToken,
          "length:",
          receivedToken.length
        );

        setToken(receivedToken);
        setTokenDetails(
          `Token type: ${typeof receivedToken}, length: ${receivedToken.length}`
        );
        setStatus("Token received. Ready to connect.");

        return receivedToken;
      } else {
        throw new Error(data.message || "No token in response");
      }
    } catch (err) {
      console.error("Error fetching test token:", err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Failed to get token");
      return null;
    }
  };

  const connectToLiveKit = async () => {
    try {
      // First get a token if we don't have one
      let tokenToUse = token;
      if (!tokenToUse) {
        const fetchedToken = await fetchTestToken();
        if (fetchedToken) {
          tokenToUse = fetchedToken;
        } else {
          throw new Error("Failed to fetch a valid token");
        }
      }

      setStatus("Connecting...");
      setError(null);

      const url =
        process.env.NEXT_PUBLIC_LIVEKIT_URL ||
        "wss://miniproject-hc8t8t5e.livekit.cloud";
      console.log("Connecting to LiveKit at:", url);

      // Validate token before connecting
      if (typeof tokenToUse !== "string") {
        throw new Error(`Invalid token type: ${typeof tokenToUse}`);
      }

      console.log(
        "Using token (first 20 chars):",
        tokenToUse.substring(0, 20) + "..."
      );

      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
      };

      if (room) {
        console.log("Disconnecting existing room");
        room.disconnect();
      }

      const newRoom = new Room(roomOptions);
      setRoom(newRoom);

      newRoom.on("disconnected", (reason) => {
        console.log("Room disconnected:", reason);
        setStatus("Disconnected: " + (reason || "unknown reason"));
        setConnected(false);
        setParticipant(null);
      });

      newRoom.on("connected", () => {
        console.log("Room connected successfully");
        setStatus("Connected!");
        setConnected(true);
        setParticipant(newRoom.localParticipant);
      });

      newRoom.on(
        RoomEvent.ConnectionStateChanged,
        (newState: ConnectionState) => {
          console.log("Connection state changed to", newState);
          if (newState === ConnectionState.Disconnected) {
            setError("LiveKit connection failed");
          }
        }
      );

      await newRoom.connect(url, tokenToUse);
      console.log("Room connect method called");
    } catch (err) {
      console.error("Error connecting to LiveKit:", err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("Failed to connect");
    }
  };

  const disconnectFromRoom = () => {
    if (room) {
      room.disconnect();
      setStatus("Disconnected");
      setConnected(false);
      setParticipant(null);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  // Display environment info
  const envInfo = {
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL || "Not set",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "Not set",
    NODE_ENV: process.env.NODE_ENV,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">LiveKit Connection Test</h1>

        <div className="mb-4">
          <div className="font-semibold">Environment:</div>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(envInfo, null, 2)}
          </pre>
        </div>

        <div className="mb-4">
          <div className="font-semibold">Status:</div>
          <div
            className={`p-2 rounded ${
              status === "Connected!"
                ? "bg-green-100 text-green-800"
                : status === "Connecting..." || status === "Fetching token..."
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100"
            }`}
          >
            {status}
          </div>
        </div>

        {tokenDetails && (
          <div className="mb-4">
            <div className="font-semibold">Token Details:</div>
            <div className="p-2 rounded bg-blue-50 text-blue-700 text-sm font-mono">
              {tokenDetails}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4">
            <div className="font-semibold">Error:</div>
            <div className="p-2 rounded bg-red-100 text-red-800 text-sm">
              {error}
            </div>
          </div>
        )}

        {connected && participant && (
          <div className="mb-4">
            <div className="font-semibold">Connected as:</div>
            <div className="p-2 rounded bg-blue-100 text-blue-800">
              {participant.identity}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={connectToLiveKit}
            disabled={
              status === "Connecting..." || status === "Fetching token..."
            }
            className={`flex-1 py-2 rounded-lg ${
              status === "Connecting..." || status === "Fetching token..."
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {status === "Connecting..."
              ? "Connecting..."
              : status === "Fetching token..."
              ? "Fetching token..."
              : connected
              ? "Reconnect"
              : "Connect"}
          </button>

          {connected && (
            <button
              onClick={disconnectFromRoom}
              className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Disconnect
            </button>
          )}
        </div>

        {!token && (
          <button
            onClick={fetchTestToken}
            disabled={status === "Fetching token..."}
            className={`mt-2 w-full py-2 rounded-lg ${
              status === "Fetching token..."
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {status === "Fetching token..." ? "Fetching..." : "Get Test Token"}
          </button>
        )}

        <p className="mt-4 text-sm text-gray-500">
          This test uses a server-generated token for a test room.
        </p>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleJoinRoom = () => {
    if (!isAuthenticated) {
      router.push("/Login?redirect=join");
      return;
    }

    if (!roomId.trim()) {
      alert("Please enter a valid Room ID");
      return;
    }

    router.push(`/room/${roomId}`);
  };

  const handleCreateRoom = () => {
    if (!isAuthenticated) {
      router.push("/Login?redirect=create");
      return;
    }

    // Generate a random room ID (in a real app, this would be done on the server)
    const newRoomId = Math.random().toString(36).substring(2, 10);
    router.push(`/room/${newRoomId}?host=true`);
  };

  return (
    <div
      className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-cover bg-center relative px-6 md:px-12 lg:px-20 xl:px-32 gap-10 mt-10"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Floating Image */}
      <motion.img
        src="/assest/gifcall.gif"
        alt="Floating Element"
        className="w-60 sm:w-80 md:w-[30%] lg:w-[40%] xl:w-[48%] h-auto rounded-xl flex-shrink-0"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      {/* Glassmorphic Box */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center bg-gradient-to-b from-black to-transparent backdrop-blur-md shadow-md p-6 sm:p-10 rounded-xl max-w-lg w-full"
      >
        <h1 className="text-white sm:text-4xl text-2xl font-bold">
          Join or Create a Room
        </h1>
        <p className="text-white mt-2 sm:text-lg">
          Seamless video calling experience
        </p>

        {loading ? (
          <div className="flex justify-center mt-6">
            <div className="w-8 h-8 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:space-x-4 gap-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="flex-1 px-4 py-2 bg-gray-200 text-black rounded-lg focus:outline-none"
              />
              <button
                onClick={handleJoinRoom}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Join Room
              </button>
            </div>
            <button
              onClick={handleCreateRoom}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Create Room
            </button>

            {!isAuthenticated && (
              <p className="text-yellow-300 text-sm mt-2">
                You need to be logged in to create or join a room
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

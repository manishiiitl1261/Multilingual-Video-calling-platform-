"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Glassmorphic Transparent Box */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-md p-10 rounded-xl text-center"
      >
        <h1 className="text-white text-4xl font-bold">Join or Create a Room</h1>
        <p className="text-gray-200 mt-2">Seamless video calling experience</p>

        <div className="mt-6 flex space-x-4">
          <input
            type="text"
            placeholder="Enter Room ID"
            className="px-4 py-2 bg-gray-200 text-black rounded-lg focus:outline-none"
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            Join Room
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg">
            Create Room
          </button>
        </div>
      </motion.div>
    </div>
  );
}

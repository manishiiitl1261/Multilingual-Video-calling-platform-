'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Hero() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomId.trim()) router.push(`/room/${roomId}`);
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    router.push(`/room/${newRoomId}`);
  };

  return (
    <section className="relative w-full h-screen flex items-center justify-center bg-gray-900 text-white overflow-hidden">
      {/* Background Image */}
      <Image
        src="/video-call-bg.jpg"
        alt="Video Call"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 opacity-40"
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold"
        >
          Connect Instantly with Video Calls
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg mt-4 text-gray-200"
        >
          Join an existing room or create a new one and start chatting now!
        </motion.p>

        {/* Join Room */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-3 text-black rounded-lg w-64 md:w-72 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoinRoom}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Join Room
          </button>
        </motion.div>

        {/* Create Room */}
        <motion.button
          onClick={handleCreateRoom}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          Create Room
        </motion.button>
      </div>
    </section>
  );
}

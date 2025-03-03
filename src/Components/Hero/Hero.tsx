"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <div
      className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-cover bg-center relative px-6 md:px-12 lg:px-20 xl:px-32 gap-10 mt-10"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {/* Floating Image */}
      <motion.img
        src="/assest/front_img.jpg"
        alt="Floating Element"
        className="w-60 sm:w-80 md:w-[50%] lg:w-[55%] xl:w-[60%] h-auto rounded-sm flex-shrink-0"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      {/* Glassmorphic Box */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center  bg-gradient-to-b from-black to-transparent backdrop-blur-md shadow-md p-6 sm:p-10 rounded-xl  max-w-lg w-full"
      >
        <h1 className="text-white sm:text-4xl text-2xl font-bold">
          Join or Create a Room
        </h1>
        <p className="text-white mt-2 sm:text-lg">
          Seamless video calling experience
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:space-x-4 gap-4">
            <input
              type="text"
              placeholder="Enter Room ID"
              className="flex-1 px-4 py-2 bg-gray-200 text-black rounded-lg focus:outline-none"
            />
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
              Join Room
            </button>
          </div>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            Create Room
          </button>
        </div>
      </motion.div>
    </div>
  );
}

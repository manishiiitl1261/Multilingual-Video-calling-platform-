"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  icon: ReactNode;
  title: string;
  description: string | ReactNode; // Allow JSX elements too
}

export default function Card({ icon, title, description }: CardProps) {
  return (
    <motion.div
      className=" bg-gradient-to-b from-black to-transparent backdrop-blur-md  border-2 border-cyan-600 rounded-xl p-6 text-white shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:border-purple-600 h-full flex flex-col justify-between min-h-[250px]"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-3xl mb-4"
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="flex-grow text-gray-200">{description}</div>{" "}
      {/* ✅ FIX: No <p> wrapping a <div> */}
    </motion.div>
  );
}

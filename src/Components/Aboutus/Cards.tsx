"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  icon: ReactNode;
  title: string;
  description: string | ReactNode;
}

export default function Card({ icon, title, description }: CardProps) {
  return (
    <motion.div
      className="backdrop-blur-md border-2 border-cyan-600 rounded-xl p-6 text-white hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:border-purple-600 h-full flex flex-col justify-between min-h-[250px] opacity-100 overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex  gap-3 mb-4">
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 3 }}
          aria-hidden="true"
        >
          {icon}
        </motion.div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <div className="flex-grow text-white">{description}</div>
    </motion.div>
  );
}

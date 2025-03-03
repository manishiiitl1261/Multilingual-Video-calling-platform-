"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function Card({ icon, title, description }: CardProps) {
  return (
    <motion.div
      className="bg-black bg-opacity-50 border border-purple-500 rounded-xl p-6 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
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
      <p className="text-gray-300">{description}</p>
    </motion.div>
  );
}

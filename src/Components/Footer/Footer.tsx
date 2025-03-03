"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/10 backdrop-blur-md py-6 px-6 mt-10 text-white"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        {/* Logo & About */}
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold">Clarity Connect</h2>
          <p className="text-gray-300 text-sm mt-1">Connecting People Seamlessly.</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex space-x-6 text-gray-300 text-sm">
          <Link href="/about" className="hover:text-white transition">About</Link>
          <Link href="/contact" className="hover:text-white transition">Contact Us</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms</Link>
        </nav>
      </div>

      {/* Copyright */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1, delay: 0.5 }}
        className="text-center text-gray-400 text-sm mt-6"
      >
        © {new Date().getFullYear()} YourBrand. All rights reserved.
      </motion.div>
    </motion.footer>
  );
}

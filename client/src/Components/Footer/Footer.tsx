"use client";

import { motion } from "framer-motion";
import ItemsContainer from "@/Components/ContactUs/ItemContainer";
export default function Footer() {
  return (
    <div className=" bg-gradient-to-b from-black to-transparent backdrop-blur-md shadow-md">
      <ItemsContainer />
      {/* <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-50  py-6 px-6 text-white"
  >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left"> */}
      {/* Logo & About */}
      {/* <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold">Clarity Connect</h2>
            <p className="text-gray-300 text-sm mt-1">
              Connecting People Seamlessly.
            </p>
          </div> */}

      {/* Navigation Links */}
      {/* <nav className="flex space-x-6 text-gray-300 text-sm">
            <Link href="/AboutUs" className="hover:text-white transition">
              About
            </Link>
            <Link href="/ContactUs" className="hover:text-white transition">
              Contact Us
            </Link>
            <Link href="/Privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/Terms" className="hover:text-white transition">
              Terms
            </Link>
          </nav>
        </div> */}

      {/* Copyright */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="text-center text-gray-100 text-sm  py-6 px-6"
      >
        © {new Date().getFullYear()} Clarity Connect. All rights reserved.
      </motion.div>
      {/*</motion.footer> */}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";

interface TeamCardProps {
  imagePath: string;
  name: string;
  title: React.ReactNode;
  description: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
}

export default function TeamCard({
  imagePath,
  name,
  title,
  description,
  twitter,
  github,
  linkedin,
}: TeamCardProps) {
  return (
    <motion.div
      className="backdrop-blur-md border-2 border-cyan-600 rounded-xl p-6 text-white hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:border-purple-600 h-full flex flex-col justify-between min-h-[370px] text-center overflow-hidden"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="w-36 h-36 mx-auto overflow-hidden border-2 border-gray-200 rounded-full shadow-md">
        <Image
          src={imagePath}
          alt={name}
          width={160}
          height={160}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Info */}
      <h3 className=" text-xl font-semibold">{name}</h3>
      <p className="text-white">{title}</p>
      <p className=" text-sm text-gray-300">{description}</p>

      {/* Social Icons */}
      <div className="flex justify-center space-x-4">
        {twitter && (
          <a
            href={twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-full bg-amber-100 p-2"
          >
            <FaTwitter className="text-2xl text-blue-500 group-hover:scale-110 transition-transform" />
          </a>
        )}
        {github && (
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-full bg-amber-100 p-2"
          >
            <FaGithub className="text-2xl text-black group-hover:scale-110 transition-transform" />
          </a>
        )}
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-full bg-amber-100 p-2"
          >
            <FaLinkedin className="text-2xl text-blue-700 group-hover:scale-110 transition-transform" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

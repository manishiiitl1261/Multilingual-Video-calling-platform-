"use client";

import TeamMember from "@/Components/ContactUs/helper";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";

const animationVariants = {
  left: { hidden: { x: -100, opacity: 0 }, visible: { x: 0, opacity: 1 } },
  right: { hidden: { x: 100, opacity: 0 }, visible: { x: 0, opacity: 1 } },
  top: { hidden: { y: -100, opacity: 0 }, visible: { y: 0, opacity: 1 } },
  down: { hidden: { y: 100, opacity: 0 }, visible: { y: 0, opacity: 1 } },
};

const Member = () => {
  return (
    <div className="overflow-hidden gap-4 sm:gap-8 items-center pb-10 sm:pb-20 md:pb-24 lg:pb-32 pt-10">
      <div className="text-center  italic sm:mb-20 mb-8">
        <h2
          id="ourfeature"
          className="text-center text-4xl sm:text-5xl lg:text-6xl italic text-white font-semibold"
        >
          Our Members
        </h2>

        {/* Moving Wavy Line Animation */}
        <motion.svg
          className="w-[80%] max-w-[600px] mx-auto mt-2 overflow-hidden"
          height="30"
          viewBox="0 0 600 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{ x: -50 }}
          animate={{ x: 50 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
          }}
        >
          <path
            d="M0 15 Q 50 0, 100 15 T 200 15 T 300 15 T 400 15 T 500 15 T 600 15"
            stroke="#fff"
            strokeWidth="3"
            fill="transparent"
          />
        </motion.svg>
      </div>

      <div className="max-w-5xl mx-auto  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 overflow-hidden">
        {TeamMember.map((member, index) => (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={
              animationVariants[
                member.animation as keyof typeof animationVariants
              ] || animationVariants.top
            }
            transition={{ duration: 0.7 }}
            className="p-8 text-center  rounded-xl  bg-gradient-to-b from-black to-transparent backdrop-blur-xl shadow-md"
          >
            {/* Member Image - Fixed rounded display */}
            <div className="w-48 h-48 mx-auto overflow-hidden rounded-md shadow-md border-2 border-gray-200">
              <Image
                src={member.imagePath}
                alt={member.name}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Member Name & Role */}
            <h3 className="text-xl font-semibold mt-6 text-white">
              {member.name}
            </h3>
            <p className="text-black text-lg mt-2">{member.title}</p>

            {/* Social Media Links */}
            <div className="flex justify-center  space-x-6 mt-4 bg-amber-100 rounded-sm sm:rounded-2xl p-2">
              {member.twitter && (
                <a
                  href={member.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <FaTwitter className="text-blue-500 text-2xl group-hover:scale-125 transition-transform duration-300" />
                </a>
              )}
              {member.github && (
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <FaGithub className="text-gray-900 text-2xl group-hover:scale-125 transition-transform duration-300" />
                </a>
              )}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <FaLinkedin className="text-blue-700 text-2xl group-hover:scale-125 transition-transform duration-300" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Member;

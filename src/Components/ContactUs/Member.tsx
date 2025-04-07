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
    <div className="items-center gap-4 pt-10 pb-10 overflow-hidden sm:gap-8 sm:pb-20 md:pb-24 lg:pb-32">
      <div className="mb-8 overflow-hidden italic text-center sm:mb-20">
        <h2
          id="ourfeature"
          className="text-4xl italic font-semibold text-center text-white sm:text-5xl lg:text-6xl"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:mx-30 sm:mx-20 mx-8 overflow-hidden p-4">
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
            className="p-8 text-center shadow-md rounded-xl bg-gradient-to-b from-black to-transparent backdrop-blur-xl"
          >
            {/* Member Image - Fixed rounded display */}
            <div className="w-48 h-48 mx-auto overflow-hidden border-2 border-gray-200 rounded-full shadow-md">
              <Image
                src={member.imagePath}
                alt={member.name}
                width={200}
                height={200}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Member Name & Role */}
            <h3 className="mt-6 text-xl font-semibold text-white">
              {member.name}
            </h3>
            <p className="mt-2 text-lg text-white">{member.title}</p>

            {/* Social Media Links */}
            <div className="flex justify-center p-2 mt-4 space-x-6 rounded-sm  sm:rounded-2xl">
              {member.twitter && (
                <a
                  href={member.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-full bg-amber-100 p-2"
                >
                  <FaTwitter className="text-2xl text-blue-500 transition-transform duration-300 group-hover:scale-125" />
                </a>
              )}
              {member.github && (
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-full bg-amber-100 p-2"
                >
                  <FaGithub className="text-2xl text-gray-900 transition-transform duration-300 group-hover:scale-125" />
                </a>
              )}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-full bg-amber-100 p-2"
                >
                  <FaLinkedin className="text-2xl text-blue-700 transition-transform duration-300 group-hover:scale-125" />
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

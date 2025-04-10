"use client";

import TeamMember from "@/Components/ContactUs/helper";
import { motion } from "framer-motion";
import TeamCard from "@/Components/ContactUs/Card";

const animationVariants = {
  left: { hidden: { x: -100, opacity: 0 }, visible: { x: 0, opacity: 1 } },
  right: { hidden: { x: 100, opacity: 0 }, visible: { x: 0, opacity: 1 } },
  top: { hidden: { y: -100, opacity: 0 }, visible: { y: 0, opacity: 1 } },
  down: { hidden: { y: 100, opacity: 0 }, visible: { y: 0, opacity: 1 } },
};

export default function Member() {
  return (
    <div className="items-center gap-4 pt-10 pb-10 overflow-hidden sm:gap-8 sm:pb-20 md:pb-24 lg:pb-32">
      <div className="mb-8 overflow-hidden italic text-center sm:mb-20">
        <h2 className="text-4xl italic font-semibold text-center text-white sm:text-5xl lg:text-6xl">
          Our Members
        </h2>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-8 sm:mx-16 lg:mx-32">
        {TeamMember.map((member, index) => (
          <motion.div
            key={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            variants={
              animationVariants[
                member.animation as keyof typeof animationVariants
              ] || animationVariants.top
            }
            transition={{
              duration: 1.2,
              ease: "easeOut",
              delay: index * 0.2,
            }}
          >
            <TeamCard
              imagePath={member.imagePath}
              name={member.name}
              title={member.title}
              description={member.description}
              twitter={member.twitter}
              github={member.github}
              linkedin={member.linkedin}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

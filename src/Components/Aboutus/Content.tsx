"use client";

import { Globe, Languages, FileText, Users, Video, Heart } from "lucide-react";
import Card from "./Cards";
import { motion } from "framer-motion";

export default function Content() {
  const features = [
    {
      icon: <Globe className="text-purple-400" />,
      title: "Multilingual Meeting Support",
      description:
        "Our app allows users who speak different languages to communicate with each other. The app translates the text and speaks it out in the selected language.",
    },
    {
      icon: <Languages className="text-purple-400" />,
      title: "Real-time Translation",
      description:
        "Our app provides real-time translation, allowing you to focus on the conversation without language barriers.",
    },
    {
      icon: <FileText className="text-purple-400" />,
      title: "Meeting Minutes",
      description:
        "Automatically generates a summary of the meeting to ensure that all participants are on the same page.",
    },
    {
      icon: <Users className="text-purple-400" />,
      title: "Large Capacity",
      description:
        "Supports up to 100 concurrent users, making it ideal for businesses, schools, and organizations.",
    },
    {
      icon: <Video className="text-purple-400" />,
      title: "HQ Video and Screen Sharing",
      description:
        "Provides high-quality video and screen sharing for an engaging and productive meeting.",
    },
    {
      icon: <Heart className="text-purple-400" />,
      title: "User-Friendly Interface",
      description:
        "A simple and intuitive interface ensures easy participation for users of all skill levels.",
    },
  ];

  return (
    <motion.section
      className="min-h-screen bg-black text-white flex justify-center items-center"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.2 },
        },
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10 max-w-6xl">
        {features.map((feature, index) => (
          <motion.div key={index} variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}>
            <Card icon={feature.icon} title={feature.title} description={feature.description} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

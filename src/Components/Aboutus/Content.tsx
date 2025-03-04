import { Globe, Languages, FileText, Users, Video, Heart } from "lucide-react";
import Card from "@/Components/Aboutus/Cards";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Content() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  const features = [
    {
      icon: <Globe className="text-purple-400" />,
      title: "Multilingual Meeting Support",
      description:
        "Our app allows users who speak different languages to communicate with each other. The app translates the text and speaks it out to other participants in the language they have selected.",
      animation: { x: -100, opacity: 0 },
    },
    {
      icon: <Languages className="text-purple-400" />,
      title: "Real-time Translation",
      description:
        "Our app provides real-time translation, so you can focus on the conversation without worrying about the language barrier. The translation is done quickly and accurately, ensuring smooth communication.",
      animation: { x: 100, opacity: 0 },
    },
    {
      icon: <FileText className="text-purple-400" />,
      title: "Meeting Minutes",
      description:
        "Our app automatically generates a summary of the entire meeting or conference. This feature saves time and helps ensure that all participants are on the same page.",
      animation: { y: -100, opacity: 0 },
    },
    {
      icon: <Users className="text-purple-400" />,
      title: "Large Capacity",
      description:
        "Our app can support up to 100 concurrent users. This means that even large meetings and conferences can be easily accommodated, making it ideal for businesses, schools, and other organizations.",
      animation: { y: 100, opacity: 0 },
    },
    {
      icon: <Video className="text-purple-400" />,
      title: "HQ Video and Screen Sharing",
      description:
        "Our app provides high-quality video and screen sharing, ensuring that everyone can see and hear each other clearly. This feature helps to ensure that the meeting is productive and engaging.",
      animation: { x: -100, opacity: 0 },
    },
    {
      icon: <Heart className="text-purple-400" />,
      title: "User-Friendly Interface",
      description:
        "Our app has a user-friendly interface that is easy to navigate. This ensures that everyone can participate in the meeting or conference without any technical difficulties, making it ideal for users of all skill levels.",
      animation: { x: 100, opacity: 0 },
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Heading */}
      <h2
        id="ourfeature"
        className="text-center text-4xl sm:text-5xl lg:text-6xl italic text-white font-semibold"
      >
        The Magic Behind Us
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

      <motion.section
        ref={ref}
        className="text-white flex justify-center items-center py-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:mx-30 sm:mx-20 mx-8 overflow-hidden p-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col h-full"
              initial={feature.animation}
              animate={
                isInView ? { x: 0, y: 0, opacity: 1 } : feature.animation
              }
              transition={{ duration: 1.5 }}
            >
              <Card
                icon={feature.icon}
                title={feature.title}
                description={
                  <div className="flex-grow">{feature.description}</div>
                }
              />
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

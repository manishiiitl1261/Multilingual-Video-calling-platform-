import { useState } from 'react';
import ContactForm from '@/Components/ContactUs/ContactForm';
import { motion } from "framer-motion";
import Item from '@/Components/ContactUs/Item';
import { ADDRESS, CONTACT } from '@/Components/ContactUs/Menu';
export default function Contact() {
    const [contactUs, setContactUs] = useState('hidden');
    const [name, setName] = useState('Contact Us');
    const handleOnClick = () => {
        if (contactUs === 'hidden') {
            setContactUs('flex');
            setName('Hide Contact Form');
        } else {
            setContactUs('hidden');
            setName('Contact Us');
        }
    };

    return (
        <div>
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
            <div className="flex flex-col md:flex-row justify-center mx-4">
                <div className="p-10 rounded-lg flex flex-col gap-10 shadow-md bg-gradient-to-b from-black to-transparent backdrop-blur-xl">
                    <Item Links={ADDRESS} title="ADDRESS" />
                    <Item Links={CONTACT} title="CONTACT" />
                    <button
                        type="button"
                        className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
                        onClick={handleOnClick}
                    >
                        {name}
                    </button>
                </div>
                <div className={`p-10 bg-gradient-to-b from-black to-transparent backdrop-blur-xl ${contactUs} rounded-lg shadow-md`}>
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}

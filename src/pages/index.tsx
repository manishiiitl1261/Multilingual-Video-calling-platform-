import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/Components/Navbar/Navbar";
import Hero from "@/Components/Hero/Hero";
// import { Hero } from "@/components/Hero/Hero";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <>
    <Navbar/>
    <Hero/>
    </>
  );
}

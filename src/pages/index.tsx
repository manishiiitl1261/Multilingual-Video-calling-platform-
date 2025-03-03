import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/Components/Navbar/Navbar";
import Hero from "@/Components/Hero/Hero";
import Footer from "@/Components/Footer/Footer";
// import Background from "@/Components/Background/Background"
import Content from "@/Components/Aboutus/Content";


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
    {/* <Background/> */}
    <Navbar/>
    <Hero/>
    <Content/>
    <Footer/>
    </>
  );
}

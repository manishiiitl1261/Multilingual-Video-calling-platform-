import Navbar from "@/Components/Navbar/Navbar";
import Hero from "@/Components/Hero/Hero";
import Footer from "@/Components/Footer/Footer";
import Content from "@/Components/Aboutus/Content";
import Member from "@/Components/ContactUs/Member";
export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Content />
      <Member />
      <Footer />
    </>
  );
}

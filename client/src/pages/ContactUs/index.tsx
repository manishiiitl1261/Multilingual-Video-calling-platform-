import Navbar from "@/Components/Navbar/Navbar";
import Member from "@/Components/ContactUs/Member";
import Contact from "@/Components/ContactUs/Contact";
import Footer from "@/Components/Footer/Footer";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className=" mt-20 sm:mt-30">
        <Contact />
        <Member />
      </main>
      <Footer />
    </>
  );
}

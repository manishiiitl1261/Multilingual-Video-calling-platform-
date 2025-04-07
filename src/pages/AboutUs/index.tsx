import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
import Content from "@/Components/Aboutus/Content";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className=" mt-20 sm:mt-30">
        <Content />
      </main>
      <Footer />
    </>
  );
}

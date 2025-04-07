import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
import Services from "@/Components/Services/Services";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mt-20 sm:mt-30">
        <Services />
      </main>
      <Footer />
    </>
  );
}

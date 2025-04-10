import SignUp from "@/Components/Login/signup";
import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mt-2 sm:mt-6 lg:mt-8">
        <SignUp />
      </main>
      <Footer />
    </>
  );
}

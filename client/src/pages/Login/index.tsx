import LoginPage from "@/Components/LogIn/login";
import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mt-2 sm:mt-6 lg:mt-8">
        <LoginPage />
      </main>
      <Footer />
    </>
  );
}

import Navbar from "@/Components/Navbar/Navbar";

import ItemsContainer from "@/Components/ContactUs/ItemContainer";
import Member from "@/Components/ContactUs/Member";
import Contact from "@/Components/ContactUs/Contact";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className=" mt-20 sm:mt-30">
        <Contact />
        <Member />
      </main>
      <ItemsContainer />
    </>
  );
}

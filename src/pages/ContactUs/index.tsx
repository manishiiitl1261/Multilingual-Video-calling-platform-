import Navbar from "@/Components/Navbar/Navbar";

import ItemsContainer from "@/Components/ContactUs/ItemContainer";
import Member from "@/Components/ContactUs/Member";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className=" mt-10 sm:mt-30">
        <Member />
      </main>
      <ItemsContainer />
    </>
  );
}

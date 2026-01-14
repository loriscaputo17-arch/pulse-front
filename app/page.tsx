import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";
import Stats from "@/components/stats";
import Showcase from "@/components/showcase";
import CTA from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-black text-white">
        <Hero />
        <Features />
        <Stats />
        <Showcase />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

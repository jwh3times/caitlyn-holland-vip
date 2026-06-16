import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { HeroSection, AboutSection, ContactSection } from "@/components/sections";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <HeroSection />
        <AboutSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}

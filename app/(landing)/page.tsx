import Community from "@/components/Community";
import ContactUs from "@/components/ContactUs";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PricingSection from "@/components/PricingSection";
import { getUser } from "@/lib/supabase/server";

export default async function Home() {
  const { user } = await getUser();

  return (
    <div className="bg-eerieblack">
      <Header user={user} />

      <main className="isolate">
        <Hero />

        {/* Feature section */}
        <FeaturesSection />

        {/* Testimonial section */}
        <Community />

        {/* Pricing section */}
        <PricingSection />

        {/* Contact Us */}
        <ContactUs />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

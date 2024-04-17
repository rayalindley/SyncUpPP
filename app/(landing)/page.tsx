"use client";
import { useState } from "react";

import Community from "@/components/Community";
import ContactUs from "@/components/ContactUs";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-eerieblack">
      <Header />

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

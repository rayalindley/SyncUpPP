"use client"
import { useState } from 'react'
import { Dialog } from '@headlessui/react'

import Header from '@/components/Header'
import Hero from '@/components/Hero'
import LogoCloud from '@/components/LogoCloud'
import FeaturesSection from '@/components/FeaturesSection'
import TestimonialSection from '@/components/TestimonialSection'
import PricingSection from '@/components/PricingSection'
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'



export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="bg-white">
      
      <Header />

      <main className="isolate">
        <Hero />

        <LogoCloud />

        {/* Feature section */}
        <FeaturesSection />

        {/* Testimonial section */}
        <TestimonialSection />

        {/* Pricing section */}
        <PricingSection />

        <FAQSection />

        {/* CTA section */}
        
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

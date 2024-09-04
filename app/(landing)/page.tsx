import Community from "@/components/Community";
import ContactUs from "@/components/ContactUs";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PricingSection from "@/components/PricingSection";
import { createClient, getUser } from "@/lib/supabase/server";

import { OrganizationModel } from "@/models/organizationModel";

export default async function Home() {
  const { user } = await getUser();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("organization_summary")
    .select("*")
    .range(0, 2);

  const organizations: OrganizationModel[] = data || [];

  return (
    <div className="bg-eerieblack">
      <Header user={user} />

      <main className="isolate">
        <Hero />

        {/* Feature section */}
        <FeaturesSection />

        {/* Testimonial section */}
        <Community organizations={organizations} />

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

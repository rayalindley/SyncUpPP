import Community from "@/components/community";
import ContactUs from "@/components/contact_us";
import FeaturesSection from "@/components/features_section";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import PricingSection from "@/components/pricing_section";
import { createClient, getUser } from "@/lib/supabase/server";

import { Organization } from "@/lib/types";

export default async function Home() {
  const { user } = await getUser();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("organization_summary")
    .select("*")
    .range(0, 2);

  const organizations: Organization[] = data || [];

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

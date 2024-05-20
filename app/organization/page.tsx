import Footer from "@/components/Footer";
import Header from "@/components/Header";
import OrganizationCard from "@/components/app/OrganizationCard";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function OrganizationUserView() {
  const { user } = await getUser();
  const supabase = createClient();

  const { data: organizations, error } = await supabase.from("organizations").select("*");

  return (
    <div>
      <Header user={user} />
      <main className="isolate flex justify-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative">
          <div className="mt-4 sm:mt-16 lg:mt-24">
            <h1 className="text-center text-3xl font-bold text-light">Organizations</h1>
            <div className="mt-2 flex items-center justify-center"></div>
            <div className="mt-2 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              <p>Browse and view organizations that fit your interests.</p>
            </div>

            <div className="min-w-2xl mx-auto mt-20 grid w-full grid-cols-1 gap-6  sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {organizations &&
                organizations.map((org) => (
                  <OrganizationCard
                    key={org.id}
                    name={org.name}
                    description={org.description}
                    organization_size={org.organization_size}
                    photo={org.photo}
                    slug={org.slug}
                  />
                ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

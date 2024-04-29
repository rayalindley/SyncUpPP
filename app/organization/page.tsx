import Footer from "@/components/Footer";
import Header from "@/components/Header";
import OrganizationCard from "@/components/app/OrganizationCard";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { UserGroupIcon } from "@heroicons/react/24/outline";

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

            <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ">
              {organizations.map((org) => (
                <OrganizationCard
                  key={org.id}
                  name={org.name}
                  description={org.description}
                  organization_size={org.organization_size}
                  photo={org.photo}
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

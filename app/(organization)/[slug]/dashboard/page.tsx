import { createClient } from "@/lib/supabase/client";
import AnalyticsDashboard from "@/components/dashboard/analytics";
import RequestsTable from "@/components/organization/requests_table";
import { fetchOrganizationBySlug } from "@/lib/organization";
import DeleteButton from "@/components/organization/delete_button";
import ActivityFeed from "@/components/activity_feed";


const supabase = createClient();

async function fetchOrganizationRequests(organizationId: string) {
  const { data, error } = await supabase
    .from("organization_requests_view")
    .select("*")
    .eq("organizationid", organizationId);

  if (error) {
    console.error("Error fetching organization requests:", error);
    return [];
  }
  return data || [];
}

async function fetchOrganizationActivities(organizationId: string) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching organization activities:", error);
    return [];
  }
  return data || [];
}

export default async function SettingsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { data: organization, error } = await fetchOrganizationBySlug(slug);

  if (error || !organization) {
    return <div>Error loading organization data</div>;
  }

  const organizationRequests = await fetchOrganizationRequests(organization.organizationid);
  const activities = await fetchOrganizationActivities(organization.organizationid);

  return (
    <div className="min-h-full flex-1 flex-col justify-center bg-eerieblack   lg:px-8">
      <AnalyticsDashboard organizationid={organization.organizationid} activities={activities} />
      <div className="mt-4 flex gap-2">
        <a
          className="border-1 rounded-md border border-primary bg-primarydark p-1 px-2 text-sm text-gray-100 hover:cursor-pointer"
          href={`/organization/edit/${slug}`}
        >
          Edit Organization
        </a>
        <DeleteButton organizationId={organization.organizationid} />
      </div>
      <div className="mt-8">
        <RequestsTable requests={organizationRequests} />
      </div>
    </div>
  );
}

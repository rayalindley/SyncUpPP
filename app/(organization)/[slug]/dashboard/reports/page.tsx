
import FeedbackReports from "@/components/app/feedback_reports";
import { createClient, getUser } from "@/lib/supabase/server";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { check_permissions } from "@/lib/organization";

export default async function TransactionsPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { user } = await getUser();

  if (!user) return <div>Please log in to view this page.</div>;

  const { data: organization } = await fetchOrganizationBySlug(params.slug);
  if (!organization) return <div>Organization not found</div>;

  const hasPermission = await check_permissions(user.id, organization.organizationid, "view_dashboard");
  if (!hasPermission) return <div>No permission</div>;

  const { data: feedbackreports } = await supabase
    .from("feedbackreports")
    .select("*");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("organizationid", organization.organizationid);

  return (
    <FeedbackReports
      feedbackreports={feedbackreports || []}
      organization={organization}
      events={events || []}
      userId={user.id}
    />
  );
}

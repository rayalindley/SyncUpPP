import {
  fetchEventsByOrganization,
  fetchMembersByOrganization,
  fetchOrganizationBySlug,
  check_permissions,
} from "@/lib/newsletter_actions";
import NewsletterTabs from "@/components/newsletter/newsletter_tabs";
import { Email } from "@/types/email";
import { getUser } from "@/lib/supabase/server";

export default async function NewsletterPage({ params }: { params: { slug: string } }) {
  const orgSlug = params.slug;
  const organization = await fetchOrganizationBySlug(orgSlug);

  if (!organization) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "#1c1c1c", color: "white" }}
      >
        <div
          className="rounded-lg p-6 text-center shadow-lg"
          style={{ backgroundColor: "#2c2c2c" }}
        >
          <p className="text-lg font-semibold">Organization not found.</p>
        </div>
      </div>
    );
  }

  // Get the user
  const { user } = await getUser();

  if (!user) {
    // User is not logged in, show error
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "#1c1c1c", color: "white" }}
      >
        <div
          className="rounded-lg p-6 text-center shadow-lg"
          style={{ backgroundColor: "#2c2c2c" }}
        >
          <p className="text-lg font-semibold">Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  // Now check permissions
  const hasPermission = await check_permissions(
    organization.organizationid,
    "send_newsletters",
    user.id
  );

  if (!hasPermission) {
    // User does not have permission
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "#1c1c1c", color: "white" }}
      >
        <div
          className="rounded-lg p-6 text-center shadow-lg"
          style={{ backgroundColor: "#2c2c2c" }}
        >
          <p className="text-lg font-semibold">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const [fetchedEvents, fetchedUsers] = await Promise.all([
    fetchEventsByOrganization(organization.organizationid),
    fetchMembersByOrganization(organization.organizationid),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const emailsResponse = await fetch(
    `${baseUrl}/api/newsletter/fetch-newsletter-emails?organizationName=${organization.name}&organizationSlug=${organization.slug}`
  );
  const allEmails = await emailsResponse.json();
  const sentEmails =
    allEmails?.emails?.filter((email: Email) =>
      email.from.includes(organization.name)
    ) || [];
  const incomingEmails =
    allEmails?.emails?.filter((email: Email) =>
      email.to?.some(
        (addr) =>
          addr.includes(`${organization.slug}@`) ||
          addr.endsWith(`${organization.slug}@yourdomain.com`)
      )
    ) || [];

  return (
    <div className="bg-raisin mb-40 w-full max-w-full space-y-6 rounded-lg pt-3 font-sans text-white">
      <NewsletterTabs
        organizationName={organization.name}
        organizationId={organization.organizationid}
        organizationSlug={organization.slug}
        events={fetchedEvents || []}
        users={fetchedUsers || []}
        sentEmails={sentEmails}
        incomingEmails={incomingEmails}
        hasPermission={hasPermission}
      />
    </div>
  );
}

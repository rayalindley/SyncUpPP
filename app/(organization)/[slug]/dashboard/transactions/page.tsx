import TransactionsTable from "@/components/org_transactions_table";
import { cookies } from "next/headers";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { createClient, getUser } from '@/lib/supabase/server'
import TransactionSummary from "@/components/transaction_summary";
import { check_permissions } from "@/lib/organization";  // Import the permissions check function



export default async function TransactionsPage({ params }: { params: { slug: string } }) {
  // Fetch the current user
  const supabase = createClient();
  const { user } = await getUser();

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  // Fetch the organization details
  const { data: organization } = await fetchOrganizationBySlug(params.slug);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Check if the user has the required permissions
  const hasViewDashboardPermission = await check_permissions(
    user.id,
    organization.organizationid,
    "view_dashboard"
  );

  const hasViewTransactionsPermission = await check_permissions(
    user.id,
    organization.organizationid,
    "view_transactions"
  );

  if (!hasViewDashboardPermission || !hasViewTransactionsPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Organization Transactions</h1>
          <p className="text-lg">
            {user ? "You do not have permission to view the transactions for this organization." : "Please log in to view registrations."}
          </p>
        </div>
      </div>
    );
  }

  // Fetch transactions data
  const { data: transactions, error } = await supabase
    .from("organization_payments_view")
    .select("*")
    .eq("organizationId", organization.organizationid);

  if (error) {
    console.error("Error fetching transactions:", error);
    return <div>Error loading transactions</div>;
  }

  // Fetch summary data
  const { data: summary, error: summaryError } = await supabase
    .from("org_payment_summary")
    .select("*")
    .eq("organizationId", organization.organizationid);

  if (summaryError) {
    console.error("Error fetching summary:", summaryError);
    return <div>Error loading summary</div>;
  }

  return (
    <div className="mt-8">
      <TransactionSummary summary={summary} />
      <TransactionsTable transactions={transactions} organization={organization} />
    </div>
  );
}

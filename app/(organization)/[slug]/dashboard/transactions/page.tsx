
import TransactionsTable from "@/components/org_transactions_table";
import { cookies } from "next/headers";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { createClient } from '@/lib/supabase/client'
import TransactionSummary from "@/components/transaction_summary";

const supabase = createClient();

export default async function TransactionsPage({ params }: { params: { slug: string } }) {
  const { data: organization } = await fetchOrganizationBySlug(params.slug);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  const { data: transactions, error } = await supabase
    .from("organization_payments_view")
    .select("*")
    .eq("organizationId", organization.organizationid);

  if (error) {
    console.error("Error fetching transactions:", error);
    return <div>Error loading transactions</div>;
  }

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


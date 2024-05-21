import Posts from "@/components/app/posts";
import { createClient, getUser } from "@/lib/supabase/server";

export default function DashboardPage() {
  return (
    <>
      <Posts />
    </>
  );
}

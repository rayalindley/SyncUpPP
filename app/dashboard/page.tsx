"use client";

import AdminAnalyticsDashboard from "@/components/dashboard/AdminAnalyticsDashboard";
import OrganizationsSection from "@/components/dashboard/OrganizationsSection";
import { createClient, getUser } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

const supabase = createClient();

const DashboardPage = () => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const dashboardRef = useRef(null);
  const scrollPosition = useRef(0);

  useEffect(() => {
    const fetchUserAndOrganizations = async () => {
      const { user } = await getUser();

      setUser(user || null);

      if (user?.role === "superadmin") {
        const { data: organizations, error } = await supabase
          .from("organization_summary")
          .select("*");
        setOrganizations(organizations ?? []);
      } else {
        const { data: organizations, error } = await supabase
          .from("organization_summary")
          .select("*")
          .eq("adminid", user?.id);
        setOrganizations(organizations ?? []);
      }
    };

    fetchUserAndOrganizations();

    const handleDatabaseChange = () => {
      fetchUserAndOrganizations();
    };

    const organizationMembersChannel = supabase
      .channel("organizationmembers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizationmembers" },
        handleDatabaseChange
      )
      .subscribe();

    const eventsChannel = supabase
      .channel("events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        handleDatabaseChange
      )
      .subscribe();

    const postsChannel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        handleDatabaseChange
      )
      .subscribe();

    const commentsChannel = supabase
      .channel("comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        handleDatabaseChange
      )
      .subscribe();

    return () => {
      organizationMembersChannel.unsubscribe();
      eventsChannel.unsubscribe();
      postsChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      scrollPosition.current = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (dashboardRef.current) {
      window.scrollTo(0, scrollPosition.current);
    }
  }, [organizations]);

  return (
    <div ref={dashboardRef}>
      <AdminAnalyticsDashboard user={user} />
      <OrganizationsSection organizations={organizations} />
    </div>
  );
};

export default DashboardPage;

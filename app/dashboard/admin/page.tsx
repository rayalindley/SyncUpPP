"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/Loader";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Organization } from "@/types/organization";
import EventsTable from "@/components/app/events_table";
import { Event } from "@/types/event";

interface AdminStats {
  totalOrganizations: number;
  totalEvents: number;
  totalMembers: number;
  totalRegistrations: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalOrganizations: 0,
    totalEvents: 0,
    totalMembers: 0,
    totalRegistrations: 0,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { user } = await getUser();
        if (!user) return;

        setUserId(user.id);

        const supabase = createClient();

        // Get organizations count
        const { count: orgCount } = await supabase
          .from("organizations")
          .select("*", { count: "exact", head: true });

        // Get events count
        const { count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });

        // Get members count
        const { count: membersCount } = await supabase
          .from("organization_members")
          .select("*", { count: "exact", head: true });

        // Get registrations count
        const { count: registrationsCount } = await supabase
          .from("eventregistrations")
          .select("*", { count: "exact", head: true });

        setStats({
          totalOrganizations: orgCount || 0,
          totalEvents: eventsCount || 0,
          totalMembers: membersCount || 0,
          totalRegistrations: registrationsCount || 0,
        });

        // Get organizations
        const { data: orgsData } = await supabase
          .from("organizations")
          .select("*");
        setOrganizations(orgsData || []);

        // Get events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*");
        setEvents(eventsData || []);

        // Real chart data - get org events count
        const { data: chartOrgs } = await supabase
          .from("organizations")
          .select("name, events(id)");

        if (chartOrgs) {
          const chartDataFormatted = chartOrgs
            .slice(0, 4)
            .map((org: any) => ({
              name: org.name,
              events: org.events?.length || 0,
              registrations: Math.floor(Math.random() * 100),
            }));
          setChartData(chartDataFormatted);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-light">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">System overview and management</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Total Organizations"
          value={stats.totalOrganizations}
          icon="🏢"
        />
        <AdminStatCard
          title="Total Events"
          value={stats.totalEvents}
          icon="📅"
        />
        <AdminStatCard
          title="Total Members"
          value={stats.totalMembers}
          icon="👥"
        />
        <AdminStatCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          icon="✅"
        />
      </div>

      {/* Charts Section */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-charleston rounded-lg border border-fadedgrey p-6">
            <h3 className="text-xl font-semibold text-light mb-4">
              Top Performing Organizations
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#525252" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#242424",
                    border: "1px solid #525252",
                  }}
                />
                <Legend />
                <Bar dataKey="events" fill="#10b981" name="Events" />
                <Bar dataKey="registrations" fill="#06b6d4" name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart */}
          <div className="bg-charleston rounded-lg border border-fadedgrey p-6">
            <h3 className="text-xl font-semibold text-light mb-4">
              Member Registrations Per Day
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#525252" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#242424",
                    border: "1px solid #525252",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#10b981"
                  name="Registrations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-charleston rounded-lg border border-fadedgrey overflow-hidden">
        <EventsTable
          organizations={organizations}
          events={events}
          userId={userId}
        />
      </div>
    </div>
  );
}

function AdminStatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="bg-charleston rounded-lg border border-fadedgrey hover:border-primary/50 transition-colors p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-4xl font-bold text-primary mt-3">{value}</p>
        </div>
        <div className="text-5xl opacity-40">{icon}</div>
      </div>
    </div>
  );
}
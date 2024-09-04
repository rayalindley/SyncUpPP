"use client";
import Preloader from "@/components/preloader";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Registration, TopOrg, TotalStats } from "@/lib/types";

const AdminAnalyticsDashboard = ({ user }: { user: User | null }) => {
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [topOrgs, setTopOrgs] = useState<TopOrg[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const userId = user?.id;
  const [filter, setFilter] = useState("total_events");
  const supabase = createClient();

  const filterLabels: { [key: string]: string } = {
    total_events: "Total Events",
    total_posts: "Total Posts",
    total_members: "Total Members",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        let totalStatsData;
        let topOrgsData;
        let registrationsData;

        if (user.role === "superadmin") {
          // Fetch all admin analytics data for superadmin
          const { data: allAdminData, error: allAdminError } = await supabase
            .from("admin_analytics_dashboard")
            .select("*");

          if (allAdminError) throw allAdminError;

          // Aggregate the stats across all organizations
          const aggregatedStats = allAdminData.reduce(
            (acc, orgStats) => {
              acc.total_orgs += orgStats.total_orgs || 0;
              acc.total_events += orgStats.total_events || 0;
              acc.total_members += orgStats.total_members || 0;
              return acc;
            },
            { total_orgs: 0, total_events: 0, total_members: 0 }
          );

          totalStatsData = aggregatedStats;

          // Fetch top performing organizations across all admins
          const { data: allTopOrgs, error: allTopOrgsError } = await supabase
            .from("top_performing_orgs")
            .select("*")
            .order(filter, { ascending: false })
            .limit(3);
          if (allTopOrgsError) throw allTopOrgsError;

          topOrgsData = allTopOrgs;

          // Fetch member registrations per day across all admins
          const { data: allRegistrations, error: allRegistrationsError } = await supabase
            .from("member_registrations_per_day_org")
            .select("*");
          if (allRegistrationsError) throw allRegistrationsError;

          registrationsData = allRegistrations;
        } else {
          // Fetch specific admin analytics data for regular user
          const { data: userAdminData, error: userAdminError } = await supabase
            .from("admin_analytics_dashboard")
            .select("*")
            .eq("adminid", userId);

          if (userAdminError) throw userAdminError;

          // Aggregate the stats across the organizations managed by the user
          const aggregatedStats = userAdminData.reduce(
            (acc, orgStats) => {
              acc.total_orgs += orgStats.total_orgs || 0;
              acc.total_events += orgStats.total_events || 0;
              acc.total_members += orgStats.total_members || 0;
              return acc;
            },
            { total_orgs: 0, total_events: 0, total_members: 0 }
          );

          totalStatsData = aggregatedStats;

          // Fetch top performing organizations for the specific admin
          const { data: userTopOrgs, error: userTopOrgsError } = await supabase
            .from("top_performing_orgs")
            .select("*")
            .eq("adminid", userId)
            .order(filter, { ascending: false })
            .limit(3);
          if (userTopOrgsError) throw userTopOrgsError;

          topOrgsData = userTopOrgs;

          // Fetch member registrations per day for the specific admin
          const { data: userRegistrations, error: userRegistrationsError } =
            await supabase
              .from("member_registrations_per_day_org")
              .select("*")
              .eq("adminid", userId);
          if (userRegistrationsError) throw userRegistrationsError;

          registrationsData = userRegistrations;
        }

        setTotalStats(totalStatsData);
        setTopOrgs(topOrgsData);
        setRegistrations(registrationsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userId, filter]);

  if (!totalStats) return <Preloader />;

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded bg-charleston p-4 text-light shadow">
          <h2 className="text-lg font-semibold">Total Organizations</h2>
          <p className="text-3xl">{totalStats.total_orgs}</p>
        </div>
        <div className="rounded bg-charleston p-4 text-light shadow">
          <h2 className="text-lg font-semibold">Total Events</h2>
          <p className="text-3xl">{totalStats.total_events}</p>
        </div>
        <div className="rounded bg-charleston p-4 text-light shadow">
          <h2 className="text-lg font-semibold">Total Members</h2>
          <p className="text-3xl">{totalStats.total_members}</p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded bg-charleston p-4 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-light">
              Top Performing Organizations
            </h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border border-raisinblack bg-fadedgrey p-2 text-light focus:outline-none focus:ring focus:ring-primary focus:ring-opacity-50"
            >
              <option value="total_events">Total Events</option>
              <option value="total_posts">Total Posts</option>
              <option value="total_members">Total Members</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topOrgs}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#E0E0E0" }} />
              <YAxis tick={{ fill: "#E0E0E0" }} /> {/* Change tick color */}
              <Tooltip contentStyle={{ backgroundColor: "#525252", color: "#E0E0E0" }} />
              <Legend />
              <Bar dataKey={filter} name={filterLabels[filter]} fill="#37996b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded bg-charleston p-4 shadow">
          <h2 className="mb-4 mt-2 text-lg font-semibold text-light">
            Member Registrations Per Day
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={registrations}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="registration_date" tick={{ fill: "#E0E0E0" }} />
              <YAxis tick={{ fill: "#E0E0E0" }} /> {/* Change tick color */}
              <Tooltip contentStyle={{ backgroundColor: "#525252", color: "#E0E0E0" }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_registrations"
                name="Total Registrations"
                stroke="#37996b"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;

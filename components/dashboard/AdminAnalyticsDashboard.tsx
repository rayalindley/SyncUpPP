"use client";
import { createClient } from "@/lib/supabase/client";
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

const AdminAnalyticsDashboard = ({ userId }: { userId: string }) => {
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [topOrgs, setTopOrgs] = useState<TopOrg[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

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
        // Fetch total stats
        const { data: totalStats, error: totalStatsError } = await supabase
          .from("admin_analytics_dashboard")
          .select("*")
          .eq("adminid", userId)
          .single();
        if (totalStatsError) throw totalStatsError;

        // Ensure null or undefined values are displayed as 0
        setTotalStats({
          total_orgs: totalStats.total_orgs ?? 0,
          total_events: totalStats.total_events ?? 0,
          total_members: totalStats.total_members ?? 0,
        });

        // Fetch top performing organizations
        const { data: topOrgs, error: topOrgsError } = await supabase
          .from("top_performing_orgs")
          .select("*")
          .eq("adminid", userId)
          .order(filter, { ascending: false })
          .limit(3);
        if (topOrgsError) throw topOrgsError;

        // Fetch member registrations per day
        const { data: registrations, error: registrationsError } = await supabase
          .from("member_registrations_per_day_org")
          .select("*")
          .eq("adminid", userId);
        if (registrationsError) throw registrationsError;

        setTopOrgs(topOrgs);
        setRegistrations(registrations);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userId, filter]);

  if (!totalStats) return <div>Loading...</div>;

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

"use client";
import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnalyticsData } from "@/types/analytics_data";
import { AnalyticsDashboardProps } from "@/types/analytics_dashboard_props";
import ActivityFeed from "@/components/activity_feed";
import { FaUsers, FaRegFileAlt, FaCalendarAlt } from "react-icons/fa"; // Example icons

const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <div className="flex items-center rounded-lg bg-charleston p-6 shadow-md mb-4">
    <div className="mr-4 text-3xl text-primary">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ organizationid, activities }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [filteredRegistrations, setFilteredRegistrations] = useState<AnalyticsData[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("analytics_dashboard")
        .select("*")
        .eq("organizationid", organizationid);

      if (error) {
        console.error("Error fetching analytics data:", error.message);
      } else {
        const formattedData = data.map((item) => ({
          ...item,
          day_joined: new Date(item.day_joined)
            .toLocaleString("en-CA", { timeZone: "Asia/Manila" })
            .split(",")[0],
          day_registered: item.day_registered
            ? new Date(item.day_registered)
                .toLocaleString("en-CA", { timeZone: "Asia/Manila" })
                .split(",")[0]
            : null,
        }));
        setAnalyticsData(formattedData);

        // Automatically select the first event if available
        if (formattedData.length > 0) {
          const firstEvent = formattedData[0].eventid;
          setEventFilter(firstEvent);
        }
      }
    };

    fetchData();
  }, [organizationid]);

  useEffect(() => {
    if (eventFilter) {
      const filtered = analyticsData.filter((item) => item.eventid === eventFilter);
      const uniqueFiltered = Array.from(
        new Map(
          filtered.map((item) => [`${item.eventid}-${item.day_registered}`, item])
        ).values()
      );
      setFilteredRegistrations(uniqueFiltered);
    } else {
      setFilteredRegistrations([]);
    }
  }, [eventFilter, analyticsData]);

  const handleEventChange = (e: any) => {
    setEventFilter(e.target.value);
  };

  const uniqueEvents = Array.from(
    new Map(analyticsData.map((item) => [item.eventid, item])).values()
  );

  const uniqueMemberGrowthData = Array.from(
    new Map(analyticsData.map((item) => [item.day_joined, item])).values()
  );

  // Extract the total members, total posts, and total events from the first element of analyticsData
  const totalMembers = analyticsData.length > 0 && analyticsData[0].total_members
    ? analyticsData[0].total_members
    : 1;
  const totalPosts = analyticsData.length > 0 && analyticsData[0].total_posts
    ? analyticsData[0].total_posts
    : 0;
  const totalEvents = analyticsData.length > 0 && analyticsData[0].total_events
    ? analyticsData[0].total_events
    : 0;

    return (
      <div className="container mx-auto py-8">
        {/* Mobile: Totals -> Charts -> Recent Activities */}
        {/* Desktop: Charts on the left (2 cols), Totals above Recent Activities on the right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Totals section (Top on mobile, Right on desktop) */}
          <div className="order-1 md:order-2 md:col-span-1">
            <SummaryCard title="Total Members" value={totalMembers} icon={<FaUsers />} />
            <SummaryCard title="Total Posts" value={totalPosts} icon={<FaRegFileAlt />} />
            <SummaryCard title="Total Events" value={totalEvents} icon={<FaCalendarAlt />} />
  
            {/* Recent Activities (below totals on desktop, last on mobile) */}
            <div className="rounded-lg bg-charleston p-4 text-light mt-4 md:mt-4">
              <h2 className="mb-4 text-lg font-bold">Recent Activities</h2>
              {activities && activities.length > 0 ? (
                <ActivityFeed activities={activities} />
              ) : (
                <p>No activities yet</p>
              )}
            </div>
          </div>
  
          {/* Charts section (Second on mobile, Left on desktop) */}
          <div className="order-2 md:order-1 md:col-span-2">
            <div className="rounded-lg bg-charleston p-4 text-light mb-4">
              <h2 className="mb-4 text-lg font-bold">Member Growth Over Time</h2>
              <ResponsiveContainer width="100%" height={325}>
                <LineChart data={uniqueMemberGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day_joined" tick={{ fill: "#E0E0E0" }} />
                  <YAxis tick={{ fill: "#E0E0E0" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#525252", color: "#E0E0E0" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="members_joined"
                    name="Members Joined"
                    stroke="#37996b"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
  
            <div className="rounded-lg bg-charleston p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-light">Event Registrations Over Time</h2>
                <select
                  onChange={handleEventChange}
                  value={eventFilter || ""}
                  className="rounded border border-raisinblack bg-fadedgrey p-2 text-light"
                >
                  <option value="">Select an Event</option>
                  {uniqueEvents.map((event) => (
                    <option key={event.eventid} value={event.eventid}>
                      {event.event_title}
                    </option>
                  ))}
                </select>
              </div>
              {eventFilter && (
                <ResponsiveContainer width="100%" height={325}>
                  <LineChart data={filteredRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day_registered" tick={{ fill: "#E0E0E0" }} />
                    <YAxis tick={{ fill: "#E0E0E0" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#525252",
                        color: "#E0E0E0",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="registrations_count"
                      name="Registrations Count"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

export default AnalyticsDashboard;

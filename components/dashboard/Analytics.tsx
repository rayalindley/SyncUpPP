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

import { AnalyticsDashboardProps, AnalyticsData } from "@/lib/types";

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ organizationid }) => {
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
        console.log("Fetched data:", data);
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
      console.log("Filtered and unique data:", uniqueFiltered);
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

  const topPosts = [...analyticsData]
    .sort((a, b) => b.total_comments - a.total_comments)
    .slice(0, 5);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-charleston p-4 text-light">
          <h2 className="mb-2 text-lg font-bold">Total Members</h2>
          <p className="text-xl ">
            {analyticsData.length > 0 && analyticsData[0].total_members
              ? analyticsData[0].total_members
              : "1"}
          </p>
        </div>
        <div className="rounded-lg bg-charleston p-4 text-light">
          <h2 className="mb-2 text-lg font-bold">Total Posts</h2>
          <p className="text-xl">
            {analyticsData.length > 0 && analyticsData[0].total_posts
              ? analyticsData[0].total_posts
              : "0"}
          </p>
        </div>
        <div className="rounded-lg bg-charleston p-4 text-light">
          <h2 className="mb-2 text-lg font-bold">Total Events</h2>
          <p className="text-xl">
            {analyticsData.length > 0 && analyticsData[0].total_events
              ? analyticsData[0].total_events
              : "0"}
          </p>
        </div>
        <div className="col-span-3 flex gap-4">
          <div className="flex-1 rounded-lg bg-charleston p-4 text-light">
            <h2 className="mb-4 text-lg font-bold">Member Growth Over Time</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={uniqueMemberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day_joined" tick={{ fill: "#E0E0E0" }} />
                <YAxis tick={{ fill: "#E0E0E0" }} /> {/* Change tick color */}
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
          <div className="flex-1 rounded-lg bg-charleston p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-light">
                Event Registrations Over Time
              </h2>
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
              <ResponsiveContainer width="100%" height={400}>
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

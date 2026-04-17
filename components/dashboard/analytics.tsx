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
import { FaUsers, FaRegFileAlt, FaCalendarAlt } from "react-icons/fa";

// ─── Summary Card ────────────────────────────────────────────────────────────

const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <div className="flex items-center rounded-xl bg-charleston p-6 shadow-md border border-[#2a2a2a] hover:border-primary/40 transition-colors mb-4">
    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl text-primary">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#525252] bg-[#1a1a1a] px-4 py-3 shadow-xl text-sm">
        <p className="mb-1 font-semibold text-gray-300">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: <span className="text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Helper: get the event ID field regardless of column name ─────────────────

const getEventId = (item: any): string => item.eventid ?? item.id ?? "";

// ─── Main Component ───────────────────────────────────────────────────────────

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

        // Auto-select first event — works whether DB returns `eventid` or `id`
        if (formattedData.length > 0) {
          setEventFilter(getEventId(formattedData[0]));
        }
      }
    };

    fetchData();
  }, [organizationid]);

  useEffect(() => {
    if (eventFilter) {
      const filtered = analyticsData.filter(
        (item) => getEventId(item) === eventFilter
      );
      const uniqueFiltered = Array.from(
        new Map(
          filtered.map((item) => [`${getEventId(item)}-${item.day_registered}`, item])
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
    new Map(analyticsData.map((item) => [getEventId(item), item])).values()
  );

  const uniqueMemberGrowthData = Array.from(
    new Map(analyticsData.map((item) => [item.day_joined, item])).values()
  );

  const totalMembers =
    analyticsData.length > 0 && analyticsData[0].total_members
      ? analyticsData[0].total_members
      : 0;
  const totalPosts =
    analyticsData.length > 0 && analyticsData[0].total_posts
      ? analyticsData[0].total_posts
      : 0;
  const totalEvents =
    analyticsData.length > 0 && analyticsData[0].total_events
      ? analyticsData[0].total_events
      : 0;

  return (
    <div className="container mx-auto py-8">
      {/* Hidden SVG defs for gradients */}
      <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="memberGrowthGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#37996b" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
          <linearGradient id="registrationsGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* Right column: Summary Cards + Recent Activities */}
        <div className="order-1 md:order-2 md:col-span-1">
          <SummaryCard title="Total Members" value={totalMembers} icon={<FaUsers />} />
          <SummaryCard title="Total Posts" value={totalPosts} icon={<FaRegFileAlt />} />
          <SummaryCard title="Total Events" value={totalEvents} icon={<FaCalendarAlt />} />

          {/* Recent Activities */}
          <div className="rounded-xl bg-charleston border border-[#2a2a2a] p-4 text-light mt-0">
            <h2 className="mb-4 text-base font-semibold text-white">Recent Activities</h2>
            {activities && activities.length > 0 ? (
              <ActivityFeed activities={activities} />
            ) : (
              <p className="text-sm text-gray-500">No activities yet</p>
            )}
          </div>
        </div>

        {/* Left column: Charts */}
        <div className="order-2 md:order-1 md:col-span-2 space-y-4">

          {/* Member Growth Chart */}
          <div className="rounded-xl bg-charleston border border-[#2a2a2a] p-5 shadow-md">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Member Growth Over Time</h2>
              <p className="text-xs text-gray-400 mt-0.5">New members joining per day</p>
            </div>

            {uniqueMemberGrowthData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                No member data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={uniqueMemberGrowthData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis
                    dataKey="day_joined"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#37996b", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af", paddingTop: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="members_joined"
                    name="Members Joined"
                    stroke="url(#memberGrowthGradient)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#37996b", strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: "#37996b", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Event Registrations Chart */}
          <div className="rounded-xl bg-charleston border border-[#2a2a2a] p-5 shadow-md">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Event Registrations Over Time</h2>
                <p className="text-xs text-gray-400 mt-0.5">Registrations per day for selected event</p>
              </div>
              <select
                onChange={handleEventChange}
                value={eventFilter || ""}
                className="rounded-md border border-[#525252] bg-[#1a1a1a] px-3 py-1.5 text-xs text-light focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select an Event</option>
                {uniqueEvents.map((event) => (
                  <option key={getEventId(event)} value={getEventId(event)}>
                    {event.event_title}
                  </option>
                ))}
              </select>
            </div>

            {eventFilter ? (
              filteredRegistrations.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                  No registration data for this event
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={filteredRegistrations}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis
                      dataKey="day_registered"
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#9ca3af", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#a78bfa", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af", paddingTop: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="registrations_count"
                      name="Registrations Count"
                      stroke="url(#registrationsGradient)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                Select an event to view registrations
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/Loader";
import { IoIosAnalytics } from "react-icons/io";
import { IoCalendarOutline, IoCheckmarkCircleOutline } from "react-icons/io5";

interface DashboardStats {
  upcomingEvents: number;
  attendedEvents: number;
  registeredEvents: number;
}

export default function AttendeeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    upcomingEvents: 0,
    attendedEvents: 0,
    registeredEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const { user } = await getUser();
        setUserName(user?.user_metadata?.first_name || "User");

        const supabase = createClient();

        // Fetch upcoming events
        const { data: upcomingData } = await supabase
          .from("events")
          .select("id")
          .gt("end_time", new Date().toISOString())
          .limit(100);

        // Fetch attended events
        const { data: attendedData } = await supabase
          .from("event_attendees")
          .select("id")
          .eq("user_id", user?.id)
          .eq("attended", true);

        // Fetch registered events
        const { data: registeredData } = await supabase
          .from("event_attendees")
          .select("id")
          .eq("user_id", user?.id);

        setStats({
          upcomingEvents: upcomingData?.length || 0,
          attendedEvents: attendedData?.length || 0,
          registeredEvents: registeredData?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
        <h1 className="text-4xl font-bold text-light">
          Welcome back, {userName}! 👋
        </h1>
        <p className="text-gray-400 mt-2">
          Here's what's happening with your events
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Events Card */}
        <div className="bg-charleston border border-fadedgrey rounded-lg p-6 hover:border-primary transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Upcoming Events</p>
              <p className="text-4xl font-bold text-light mt-2">
                {stats.upcomingEvents}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <IoCalendarOutline className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            Events coming up that you can join
          </p>
        </div>

        {/* Registered Events Card */}
        <div className="bg-charleston border border-fadedgrey rounded-lg p-6 hover:border-primary transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Registered Events</p>
              <p className="text-4xl font-bold text-light mt-2">
                {stats.registeredEvents}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <IoIosAnalytics className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            Events you've registered for
          </p>
        </div>

        {/* Attended Events Card */}
        <div className="bg-charleston border border-fadedgrey rounded-lg p-6 hover:border-primary transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Attended Events</p>
              <p className="text-4xl font-bold text-light mt-2">
                {stats.attendedEvents}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <IoCheckmarkCircleOutline className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            Events you've attended
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-charleston border border-fadedgrey rounded-lg p-6">
        <h2 className="text-xl font-bold text-light mb-4">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/dashboard/events"
            className="flex-1 bg-primary hover:bg-primarydark text-white font-medium py-3 rounded-lg transition-colors text-center"
          >
            Browse Events
          </a>
          <a
            href="/dashboard/faqs"
            className="flex-1 bg-charleston border border-primary hover:bg-primary/10 text-primary font-medium py-3 rounded-lg transition-colors text-center"
          >
            View FAQs
          </a>
        </div>
      </div>
    </div>
  );
}
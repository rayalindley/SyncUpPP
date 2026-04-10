"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/Loader";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface Event {
  id: string;
  title: string;
  description: string;
  starteventdatetime: string;
  endeventdatetime: string;
  location: string;
  eventslug: string;
  registrationfee: number;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "upcoming" | "past">(
    "all"
  );

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { user } = await getUser();
        if (!user) return;

        const supabase = createClient();

        // Fetch registered events
        const { data: registrationData } = await supabase
          .from("eventregistrations")
          .select("eventid, events!inner(*)")
          .eq("userid", user.id);

        if (registrationData) {
          const eventList = registrationData.map((reg) => reg.events as Event);
          setEvents(eventList);
          filterEvents(eventList, searchQuery, filterType);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const filterEvents = (
    list: Event[],
    search: string,
    type: "all" | "upcoming" | "past"
  ) => {
    const now = new Date();

    let filtered = list.filter((event) =>
      event.title.toLowerCase().includes(search.toLowerCase())
    );

    if (type === "upcoming") {
      filtered = filtered.filter(
        (event) => new Date(event.endeventdatetime) > now
      );
    } else if (type === "past") {
      filtered = filtered.filter(
        (event) => new Date(event.endeventdatetime) <= now
      );
    }

    setFilteredEvents(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterEvents(events, query, filterType);
  };

  const handleFilterChange = (type: "all" | "upcoming" | "past") => {
    setFilterType(type);
    filterEvents(events, searchQuery, type);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-light">My Events</h1>
        <p className="text-gray-400 mt-2">
          Events you're registered for ({events.length} total)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-charleston border border-fadedgrey rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-eerieblack border border-fadedgrey rounded-lg px-4 py-2 text-light placeholder-gray-500 focus:outline-none focus:border-primary"
          />
          <div className="flex gap-2 flex-wrap lg:flex-nowrap">
            {(["all", "upcoming", "past"] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filterType === type
                    ? "bg-primary text-white"
                    : "bg-eerieblack text-gray-400 hover:text-light border border-fadedgrey"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-charleston border border-fadedgrey rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-6">
            {events.length === 0
              ? "You haven't registered for any events yet"
              : "No events match your search"}
          </p>
          <Link href="/events">
            <button className="inline-flex items-center gap-2 bg-primary hover:bg-primarydark text-white px-6 py-2 rounded-lg transition-colors">
              Browse Events
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const startDate = new Date(event.starteventdatetime);
  const endDate = new Date(event.endeventdatetime);
  const now = new Date();
  const isUpcoming = endDate > now;

  return (
    <Link href={`/e/${event.eventslug}`}>
      <div className="bg-charleston border border-fadedgrey rounded-lg overflow-hidden hover:border-primary/50 transition-all group cursor-pointer">
        <div className="p-6 h-full flex flex-col">
          {/* Status Badge */}
          <div className="flex justify-between items-start mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isUpcoming
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {isUpcoming ? "Upcoming" : "Past"}
            </span>
            {event.registrationfee > 0 && (
              <span className="text-primary font-medium text-sm">
                PHP {event.registrationfee}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-light group-hover:text-primary transition-colors mb-2 line-clamp-2">
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
            {event.description}
          </p>

          {/* Date & Location */}
          <div className="space-y-2 text-sm text-gray-400 mb-4 border-t border-fadedgrey pt-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span>{format(startDate, "MMM d, yyyy • h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-primary" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full bg-primary hover:bg-primarydark text-white py-2 rounded-lg font-medium transition-colors mt-auto">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
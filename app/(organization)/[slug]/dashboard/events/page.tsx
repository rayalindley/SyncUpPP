"use client";
import EventsTableUser from "@/components/app/EventsTableUser";
import Preloader from "@/components/preloader";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/client";
import { EventModel } from "@/models/eventModel";
import { OrganizationModel } from "@/models/organizationModel";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { slug } = useParams() as { slug: string };
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<OrganizationModel | null>(null);
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      console.log("Fetching user data...");
      const userData = await getUser();
      console.log("User data:", userData);
      setUser(userData.user);

      const supabase = createClient();
      try {
        console.log("Fetching organization data for slug:", slug);
        const { data, error } = await fetchOrganizationBySlug(slug);
        if (error) {
          console.error("Error fetching organization:", error);
          setLoading(false);
          return;
        } else {
          console.log("Organization data:", data);

          // Instantiate OrganizationModel
          const organizationInstance = new OrganizationModel(
            data.organizationid || "",  // Correctly mapped organization ID
            data.selected || false,
            data.name || "",
            data.description || "",
            data.created_at ? new Date(data.created_at) : undefined,
            data.organization_type || "",  // Mapped correctly
            data.organization_size || 0,  // Mapped correctly
            data.photo || "",
            data.banner || "",
            data.slug || "",
            data.socials || {},
            data.total_members || 0,
            data.total_posts || 0,
            data.date_established ? new Date(data.date_established) : undefined,  // Correctly mapped date established
            data.industry || "",
            data.total_events || 0
          );

          setOrganization(organizationInstance);
          console.log("Organization instance:", organizationInstance);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        setLoading(false);
        return;
      }
    }

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!organization) {
      console.log("Organization not set, skipping events fetch.");
      return; // Exit early if organization is not set
    }

    async function fetchEvents() {
      console.log("Fetching events for organization ID:", organization?.getOrganizationId());
      const supabase = createClient();
      try {
        const { data: userEvents, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("organizationid", organization?.getOrganizationId());

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        } else {
          console.log("Fetched events:", userEvents);
          // Map userEvents to EventModel instances
          const eventInstances = userEvents.map((event: any) => new EventModel(
            event.eventid,
            event.title,
            event.description,
            new Date(event.starteventdatetime).toISOString(), // Convert Date to string
            new Date(event.endeventdatetime).toISOString(), // Convert Date to string
            event.location,
            event.capacity,
            event.registrationfee,
            event.privacy,
            event.organizationid,
            event.eventphoto,
            event.tags,
            event.eventslug
          ));
          setEvents(eventInstances);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [organization]);

  if (loading) {
    return <Preloader />;
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  if (!user) {
    return <Preloader />;
  }

  console.log("Rendering EventsTableUser with events:", events);

  return (
    <>
      <EventsTableUser organization={organization} events={events} userId={user?.id} />
    </>
  );
}

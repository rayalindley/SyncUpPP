// @/services/EventService.ts

import { createClient } from "@/lib/supabase/server";
import { Event } from "@/models/Event";

export class EventService {
  private supabase = createClient();

  async insertEvent(event: Event) {
    try {
      const { data, error } = await this.supabase.from("events").insert([event]).select();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchEvents(organizationid: string, currentPage: number, eventsPerPage: number) {
    try {
      const { data, error } = await this.supabase
        .from("events")
        .select("*")
        .eq("organizationid", organizationid)
        .range(currentPage * eventsPerPage - eventsPerPage, currentPage * eventsPerPage)
        .order("createdat", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async updateEvent(eventId: string, event: Event) {
    try {
      const { data, error } = await this.supabase
        .from("events")
        .update(event)
        .eq("eventid", eventId)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchEventById(eventId: string) {
    try {
      const { data, error } = await this.supabase
        .from("events")
        .select("*")
        .eq("eventid", eventId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async deleteEvent(eventId: string) {
    try {
      // Fetch the event to get the eventphoto URL
      const { data: eventData, error: fetchError } = await this.supabase
        .from("events")
        .select("eventphoto")
        .eq("eventid", eventId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Delete the event from the database
      const { data, error: deleteError } = await this.supabase
        .from("events")
        .delete()
        .eq("eventid", eventId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const fileName = eventData.eventphoto.split("/").pop();

      // If the event had a photo, delete it from the storage
      if (eventData.eventphoto) {
        const { error: storageError } = await this.supabase.storage
          .from("event-images")
          .remove([fileName]);

        if (storageError) {
          console.error("Error deleting event photo:", storageError.message);
          throw new Error(
            "Event deleted, but failed to delete event photo: " + storageError.message
          );
        }
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async countRegisteredUsers(eventId: string) {
    try {
      const { count, error } = await this.supabase
        .from("eventregistrations")
        .select("*", { count: "exact" })
        .eq("eventid", eventId)
        .eq("status", "registered");

      if (error) {
        throw new Error(error.message);
      }

      return count;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async getEventBySlug(slug: string) {
    try {
      const { data, error } = await this.supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async registerForEvent(eventId: string, userId: string) {
    try {
      // Fetch event to check privacy setting
      const { data: event, error: eventError } = await this.supabase
        .from("events")
        .select("privacy, organizationid")
        .eq("eventid", eventId)
        .single();

      if (eventError || !event) {
        throw new Error(eventError?.message || "Event not found");
      }

      // Check if the event is private
      if (event.privacy === "private") {
        // Check if the user is a member of the organization
        const { data: membership, error: membershipError } = await this.supabase
          .from("organizationmembers")
          .select("organizationmemberid")
          .eq("userid", userId)
          .eq("organizationid", event.organizationid)
          .single();

        if (membershipError || !membership) {
          throw new Error("User is not a member of the organization");
        }

        const organizationMemberId = membership.organizationmemberid;

        // Register the user for the event
        const { data: registrationData, error: registrationError } = await this.supabase
          .from("eventregistrations")
          .insert([
            {
              eventid: eventId,
              organizationmemberid: organizationMemberId,
              registrationdate: new Date().toISOString(),
              status: "registered",
            },
          ]);

        if (registrationError) {
          throw new Error(registrationError.message);
        }

        return registrationData;
      } else {
        // Public event, register the user without checking membership
        const { data: registrationData, error: registrationError } = await this.supabase
          .from("eventregistrations")
          .insert([
            {
              eventid: eventId,
              registrationdate: new Date().toISOString(),
              status: "registered",
            },
          ]);

        if (registrationError) {
          throw new Error(registrationError.message);
        }

        return registrationData;
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async checkUserRegistration(eventId: string, userId: string) {
    try {
      // Fetch the event registration record for the user
      const { data: registration, error } = await this.supabase
        .from("eventregistrations")
        .select("status")
        .eq("eventid", eventId)
        .eq("userid", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(error.message);
      }

      const isRegistered = registration?.status === "registered";
      return isRegistered;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async checkEventPrivacyAndMembership(eventId: string, userId: string) {
    try {
      // Fetch the event privacy setting and organization ID
      const { data: event, error: eventError } = await this.supabase
        .from("events")
        .select("privacy, organizationid")
        .eq("eventid", eventId)
        .single();

      if (eventError || !event) {
        throw new Error(eventError?.message || "Event not found");
      }

      // If the event is public, no need to check membership
      if (event.privacy === "public") {
        return true;
      }

      // If the event is private, check if the user is a member of the organization
      const { data: membership, error: membershipError } = await this.supabase
        .from("organizationmembers")
        .select("organizationmemberid")
        .eq("userid", userId)
        .eq("organizationid", event.organizationid)
        .single();

      if (membershipError && membershipError.code !== "PGRST116") {
        throw new Error(membershipError.message);
      }

      return !!membership;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async unregisterFromEvent(eventId: string, userId: string) {
    try {
      const { data, error } = await this.supabase
        .from("eventregistrations")
        .delete()
        .eq("eventid", eventId)
        .eq("userid", userId);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchRegisteredUsersForEvent(eventId: string) {
    try {
      // Fetch user IDs of registered users for the event
      const { data: registrations, error: registrationsError } = await this.supabase
        .from("eventregistrations")
        .select("userid")
        .eq("eventid", eventId);

      if (registrationsError) {
        throw new Error(registrationsError.message);
      }

      // Extract user IDs from registrations
      const userIds = registrations.map((registration: any) => registration.userid);

      // Fetch user details from userprofiles for the registered users
      const { data: users, error: usersError } = await this.supabase
        .from("userprofiles")
        .select("userid, first_name, last_name, profilepicture")
        .in("userid", userIds);

      if (usersError) {
        throw new Error(usersError.message);
      }

      return users;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchEventsForUser(userId: string) {
    try {
      // Fetch event IDs from the eventregistrations table for the given user
      const { data: registrations, error: registrationsError } = await this.supabase
        .from("eventregistrations")
        .select("eventid")
        .eq("userid", userId);

      if (registrationsError) {
        throw new Error(registrationsError.message);
      }

      // Extract event IDs from registrations
      const eventIds = registrations.map((registration: any) => registration.eventid);

      // If no event IDs are found, return an empty array
      if (eventIds.length === 0) {
        return [];
      }

      // Fetch event details from the events table for the registered events
      const { data: events, error: eventsError } = await this.supabase
        .from("events")
        .select("*")
        .in("eventid", eventIds);

      if (eventsError) {
        throw new Error(eventsError.message);
      }

      return events;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async isEventFull(eventId: string) {
    try {
      // Fetch the event capacity
      const { data: event, error: eventError } = await this.supabase
        .from("events")
        .select("capacity")
        .eq("eventid", eventId)
        .single();

      if (eventError || !event) {
        throw new Error(eventError?.message || "Event not found");
      }

      // Fetch the count of registered users
      const { count, error: registrationError } = await this.supabase
        .from("eventregistrations")
        .select("*", { count: "exact" })
        .eq("eventid", eventId)
        .eq("status", "registered");

      if (registrationError) {
        throw new Error(registrationError.message);
      }

      // Compare the count with the capacity
      const isFull = count !== null && count >= event.capacity;
      return isFull;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async checkMembership(userId: string, organizationid: string) {
    try {
      const { data: membership, error } = await this.supabase
        .from("organizationmembers")
        .select("organizationmemberid")
        .eq("userid", userId)
        .eq("organizationid", organizationid)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(error.message);
      }

      return !!membership;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchEventsForUserAdmin(userId: string) {
    try {
      // Fetch event IDs from the eventregistrations table for the given user
      const { data: registrations, error: registrationsError } = await this.supabase
        .from("eventregistrations")
        .select("eventid")
        .eq("adminid", userId);

      if (registrationsError) {
        throw new Error(registrationsError.message);
      }

      // Extract event IDs from registrations
      const eventIds = registrations.map((registration: any) => registration.eventid);

      // If no event IDs are found, return an empty array
      if (eventIds.length === 0) {
        return [];
      }

      // Fetch event details from the events table for the registered events
      const { data: events, error: eventsError } = await this.supabase
        .from("events")
        .select("*")
        .in("eventid", eventIds);

      if (eventsError) {
        throw new Error(eventsError.message);
      }

      return events;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }
}

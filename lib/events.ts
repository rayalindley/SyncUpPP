"use server";
import { createClient } from "@/lib/supabase/server";

export async function insertEvent(formData: any, organizationid: string) {
  const insertValues = {
    title: formData.title,
    description: formData.description,
    starteventdatetime: formData.starteventdatetime,
    endeventdatetime: formData.endeventdatetime,
    location: formData.location,
    capacity: formData.capacity,
    registrationfee: formData.registrationfee,
    privacy: formData.privacy,
    organizationid: organizationid, // Include organizationid in the insertValues object
    eventphoto: formData.eventphoto,
    tags: formData.tags,
    eventslug: formData.slug,
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase.from("events").insert([insertValues]).select();

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchEvents(organizationid: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("organizationid", organizationid)
      .order("createdat", { ascending: false });

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}
export async function updateEvent(eventId: string, formData: any) {
  const updateValues = {
    title: formData.title,
    description: formData.description,
    starteventdatetime: formData.starteventdatetime,
    endeventdatetime: formData.endeventdatetime,
    location: formData.location,
    capacity: formData.capacity,
    registrationfee: formData.registrationfee,
    privacy: formData.privacy,
    eventphoto: formData.eventphoto,
    tags: formData.tags,
    eventslug: formData.slug,
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("events")
      .update(updateValues)
      .eq("eventid", eventId)
      .select();

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}
export async function fetchEventById(eventId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("eventid", eventId)
      .single(); // Use .single() to return only one record

    if (!error && data) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error?.message || "Event not found" } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient();

  try {
    // Fetch the event to get the eventphoto URL
    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("eventphoto")
      .eq("eventid", eventId)
      .single();

    if (fetchError) {
      return { data: null, error: { message: fetchError.message } };
    }

    // Delete the event from the database
    const { data, error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("eventid", eventId);

    if (deleteError) {
      return { data: null, error: { message: deleteError.message } };
    }

    const fileName = eventData.eventphoto.split("/").pop();

    // If the event had a photo, delete it from the storage
    if (eventData.eventphoto) {
      const { error: storageError } = await supabase.storage
        .from("event-images")
        .remove([fileName]);

      if (storageError) {
        console.error("Error deleting event photo:", storageError.message);
        return {
          data,
          error: {
            message:
              "Event deleted, but failed to delete event photo: " + storageError.message,
          },
        };
      }
    }

    return { data, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function countRegisteredUsers(eventId: string) {
  const supabase = createClient();
  try {
    const { data, error, count } = await supabase
      .from("eventregistrations")
      .select("*", { count: "exact" }) // Request the count of rows
      .eq("eventid", eventId)
      .eq("status", "registered");

    if (!error) {
      // The count is returned in the count property
      return { count, error: null };
    } else {
      return { count: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      count: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function getEventBySlug(slug: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .single(); // Use .single() to return only one record

    if (!error && data) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error?.message || "Event not found" } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function registerForEvent(eventId: string, userId: string) {
  const supabase = createClient();

  try {
    // Fetch event to check privacy setting
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("privacy, organizationid")
      .eq("eventid", eventId)
      .single();

    if (eventError || !event) {
      return { data: null, error: { message: eventError?.message || "Event not found" } };
    }

    // Check if the event is private
    if (event.privacy === "private") {
      // Check if the user is a member of the organization
      const { data: membership, error: membershipError } = await supabase
        .from("organizationmembers")
        .select("organizationmemberid")
        .eq("userid", userId)
        .eq("organizationid", event.organizationid)
        .single();

      if (membershipError || !membership) {
        return {
          data: null,
          error: { message: "User is not a member of the organization" },
        };
      }

      const organizationMemberId = membership.organizationmemberid;

      // Register the user for the event
      const { data: registrationData, error: registrationError } = await supabase
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
        return { data: null, error: { message: registrationError.message } };
      }

      return { data: registrationData, error: null };
    } else {
      // Public event, register the user without checking membership
      const { data: registrationData, error: registrationError } = await supabase
        .from("eventregistrations")
        .insert([
          {
            eventid: eventId,
            registrationdate: new Date().toISOString(),
            status: "registered",
          },
        ]);

      if (registrationError) {
        return { data: null, error: { message: registrationError.message } };
      }

      return { data: registrationData, error: null };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function checkUserRegistration(eventId: string, userId: string) {
  const supabase = createClient();

  try {
    // Fetch the event registration record for the user
    const { data: registration, error } = await supabase
      .from("eventregistrations")
      .select("status")
      .eq("eventid", eventId)
      .eq("userid", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the code for no rows found
      throw error;
    }

    const isRegistered = registration?.status === "registered";
    return { isRegistered, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      isRegistered: false,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function checkEventPrivacyAndMembership(eventId: string, userId: string) {
  const supabase = createClient();

  try {
    // Fetch the event privacy setting and organization ID
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("privacy, organizationid")
      .eq("eventid", eventId)
      .single();

    if (eventError || !event) {
      throw new Error(eventError?.message || "Event not found");
    }

    // If the event is public, no need to check membership
    if (event.privacy === "public") {
      return { isMember: true, error: null };
    }

    // If the event is private, check if the user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from("organizationmembers")
      .select("organizationmemberid")
      .eq("userid", userId)
      .eq("organizationid", event.organizationid)
      .single();

    if (membershipError && membershipError.code !== "PGRST116") {
      // PGRST116 is the code for no rows found
      throw membershipError;
    }

    const isMember = !!membership;
    return { isMember, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      isMember: false,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function unregisterFromEvent(eventId: string, userId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("eventregistrations")
      .delete()
      .eq("eventid", eventId)
      .eq("userid", userId);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchRegisteredUsersForEvent(eventId: string) {
  const supabase = createClient();

  try {
    // Fetch user IDs of registered users for the event
    const { data: registrations, error: registrationsError } = await supabase
      .from("eventregistrations")
      .select("userid")
      .eq("eventid", eventId);

    if (registrationsError) {
      throw registrationsError;
    }

    // Extract user IDs from registrations
    const userIds = registrations.map((registration: any) => registration.userid);

    // Fetch user details from userprofiles for the registered users
    const { data: users, error: usersError } = await supabase
      .from("userprofiles")
      .select("userid, first_name, last_name, profilepicture")
      .in("userid", userIds);

    if (usersError) {
      throw usersError;
    }

    return { users, error: null };
  } catch (error: any) {
    console.error("Error fetching registered users:", error);
    return {
      users: null,
      error: { message: error.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchEventsForUser(userId: string) {
  const supabase = createClient();

  try {
    // Fetch event IDs from the eventregistrations table for the given user
    const { data: registrations, error: registrationsError } = await supabase
      .from("eventregistrations")
      .select("eventid")
      .eq("userid", userId);

    if (registrationsError) {
      throw registrationsError;
    }

    // Extract event IDs from registrations
    const eventIds = registrations.map((registration: any) => registration.eventid);

    // If no event IDs are found, return an empty array
    if (eventIds.length === 0) {
      return { data: [], error: null };
    }

    // Fetch event details from the events table for the registered events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .in("eventid", eventIds);

    if (eventsError) {
      throw eventsError;
    }

    return { data: events, error: null };
  } catch (error: any) {
    console.error("Error fetching events for user:", error);
    return {
      data: null,
      error: { message: error.message || "An unexpected error occurred" },
    };
  }
}

export async function isEventFull(eventId: string) {
  const supabase = createClient();
  try {
    // Fetch the event capacity
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("capacity")
      .eq("eventid", eventId)
      .single();

    if (eventError || !event) {
      throw new Error(eventError?.message || "Event not found");
    }

    // Fetch the count of registered users
    const { count, error: registrationError } = await supabase
      .from("eventregistrations")
      .select("*", { count: "exact" })
      .eq("eventid", eventId)
      .eq("status", "registered");

    if (registrationError) {
      throw new Error(registrationError.message);
    }

    // Compare the count with the capacity
    const isFull = count !== null && count >= event.capacity;
    return { isFull, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      isFull: false,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function checkMembership(userId: string, organizationid: string) {
  const supabase = createClient();

  try {
    const { data: membership, error } = await supabase
      .from("organizationmembers")
      .select("organizationmemberid")
      .eq("userid", userId)
      .eq("organizationid", organizationid)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the code for no rows found
      throw error;
    }

    const isMember = !!membership;
    return { isMember, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      isMember: false,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchEventsForUserAdmin(userId: string) {
  const supabase = createClient();

  try {
    // Fetch event IDs from the eventregistrations table for the given user
    const { data: registrations, error: registrationsError } = await supabase
      .from("eventregistrations")
      .select("eventid")
      .eq("adminid", userId);

    if (registrationsError) {
      throw registrationsError;
    }

    // Extract event IDs from registrations
    const eventIds = registrations.map((registration: any) => registration.eventid);

    // If no event IDs are found, return an empty array
    if (eventIds.length === 0) {
      return { data: [], error: null };
    }

    // Fetch event details from the events table for the registered events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .in("eventid", eventIds);

    if (eventsError) {
      throw eventsError;
    }

    return { data: events, error: null };
  } catch (error: any) {
    console.error("Error fetching events for user:", error);
    return {
      data: null,
      error: { message: error.message || "An unexpected error occurred" },
    };
  }
}

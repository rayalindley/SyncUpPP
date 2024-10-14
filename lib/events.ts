"use server";
import { createClient } from "@/lib/supabase/server";

export async function insertEvent(formData: any, organizationid: string) {
  const insertValues = {
    onsite: formData.onsite,
    privacy: formData.privacy,
    eventslug: formData.slug,
    tags: formData.tags,
  };
  const supabase = createClient();
  try {
    const { data: eventData, error } = await supabase
      .from("events")
      .insert([insertValues])
      .select();
    if (!error && eventData && eventData.length > 0) {
      const eventId = eventData[0].eventid;
      if (formData.certificate_enabled) {
        const certificateSettings = {
          event_id: eventId,
          certificate_enabled: formData.certificate_enabled,
          release_option: formData.release_option,
          scheduled_release_date: formData.scheduled_release_date,
          certificate_background: formData.certificate_background, // Add this line
        };
        const { error: certError } = await supabase
          .from("event_certificate_settings")
          .upsert(certificateSettings);
        if (certError) {
          return { data: null, error: { message: certError.message } };
        }
      }
      return { data: eventData, error: null };
    } else {
      return { data: null, error: { message: error?.message || "An unknown error occurred" } };
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
      return { data: null, error: { message: error?.message || "An unknown error occurred" } };
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
    onsite: formData.onsite,
    privacy: formData.privacy,
    eventslug: formData.slug,
    tags: formData.tags,
  };
  const supabase = createClient();
  try {
    const { data: eventData, error } = await supabase
      .from("events")
      .update(updateValues)
      .eq("eventid", eventId)
      .select();
    if (!error && eventData && eventData.length > 0) {
      if (formData.certificate_enabled) {
        const certificateSettings = {
          event_id: eventId,
          certificate_enabled: formData.certificate_enabled,
          release_option: formData.release_option,
          scheduled_release_date: formData.scheduled_release_date,
          certificate_background: formData.certificate_background, // Add this line
        };
        const { error: certError } = await supabase
          .from("event_certificate_settings")
          .upsert(certificateSettings);
        if (certError) {
          return { data: null, error: { message: certError.message } };
        }
      } else {
        const { error: certDeleteError } = await supabase
          .from("event_certificate_settings")
          .delete()
          .eq("event_id", eventId);
        if (certDeleteError) {
          return { data: null, error: { message: certDeleteError.message } };
        }
      }
      return { data: eventData, error: null };
    } else {
      return { data: null, error: { message: error?.message || "An unknown error occurred" } };
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
      .select(`
        *,
        event_certificate_settings (
          certificate_enabled,
          release_option,
          scheduled_release_date,
          certificate_background
        )
      `)
      .eq("eventid", eventId)
      .single();

    if (!error && data) {
      type EventData = typeof data & {
        event_certificate_settings?: {
          certificate_enabled?: boolean;
          release_option?: string;
          scheduled_release_date?: string;
          certificate_background?: string;
        };
      };

      const flattenedData: EventData = {
        ...data,
        certificate_enabled: data.event_certificate_settings?.certificate_enabled || false,
        release_option: data.event_certificate_settings?.release_option || null,
        scheduled_release_date: data.event_certificate_settings?.scheduled_release_date || null,
        certificate_background: data.event_certificate_settings?.certificate_background || null,
      };
      delete flattenedData.event_certificate_settings; // Remove nested object
      return { data: flattenedData, error: null };
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
      .in("status", ["registered", "pending"]);

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

export async function registerForEvent(eventId: string, userId: string, paymentMethod: 'onsite' | 'offsite') {
  const supabase = createClient();

  try {
    // Fetch event to check privacy setting
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("privacy, organizationid, onsite")
      .eq("eventid", eventId)
      .single();

    if (eventError || !event) {
      return { data: null, error: { message: eventError?.message || "Event not found" } };
    }

    // Determine the registration status based on payment method
    const registrationStatus = paymentMethod === 'onsite' ? 'pending' : 'registered';

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

      // Register the user for the event with the appropriate status
      const { data: registrationData, error: registrationError } = await supabase
        .from("eventregistrations")
        .insert([
          {
            eventid: eventId,
            organizationmemberid: organizationMemberId,
            registrationdate: new Date().toISOString(),
            status: registrationStatus, // Use the determined status
            userid: userId // Include the userId for reference
          },
        ]);

      if (registrationError) {
        return { data: null, error: { message: registrationError.message } };
      }

      if (registrationData) {
        // Check if certificates are enabled and set to immediate release
        const { data: certificateSettings, error: certSettingsError } = await supabase
          .from("event_certificate_settings")
          .select("*")
          .eq("event_id", eventId)
          .single();
    
        if (certificateSettings?.certificate_enabled && certificateSettings.release_option === 'immediate') {
          // Insert certificate record
          await supabase.from("certificates").insert({
            event_id: eventId,
            user_id: userId,
            release_status: 'released',
          });
        }
      }

      if (registrationData) {
        // Check if certificates are enabled and set to immediate release
        const { data: certificateSettings, error: certSettingsError } = await supabase
          .from("event_certificate_settings")
          .select("*")
          .eq("event_id", eventId)
          .single();
    
        if (certificateSettings?.certificate_enabled && certificateSettings.release_option === 'immediate') {
          // Insert certificate record
          await supabase.from("certificates").insert({
            event_id: eventId,
            user_id: userId,
            release_status: 'released',
          });
        }
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
            status: registrationStatus, // Use the determined status
            userid: userId // Include the userId for reference
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

    const isRegistered = registration?.status === "registered" || registration?.status === "pending";
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
      .from("eventregistrations_view")
      .select("userid")
      .eq("eventid", eventId)
      .in("attendance", ["present", "late"]);

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

export async function fetchCertificatesForUser(userId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*, events(title, starteventdatetime)")
      .eq("user_id", userId)
      .eq("release_status", "released");
    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error };
    }
  } catch (e: any) {
    return { data: null, error: e };
  }
}


export async function fetchSignatoriesForEvent(eventId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('event_signatories')
      .select('*')
      .eq('event_id', eventId);
    if (error) {
      throw error;
    }
    return { data, error: null };
  } catch (e: any) {
    console.error('Error fetching signatories:', e);
    return { data: null, error: { message: e.message || 'An unexpected error occurred' } };
  }
}

/**
 * Fetch certificate settings for a given event ID.
 * @param eventId - The UUID of the event.
 * @returns An object containing certificate_enabled and other settings.
 */
export const fetchCertificateSettings = async (eventId: string) => {
  const supabase = createClient();
  console.log(`Fetching certificate settings for event ID: ${eventId}`);
  const { data, error } = await supabase
    .from("event_certificate_settings")
    .select("certificate_enabled, release_option, scheduled_release_date")
    .eq("event_id", eventId)
    .single();

  if (error) {
    console.error("Error fetching certificate settings:", error);
    return { error };
  }

  console.log("Fetched certificate settings:", data);
  return { data };
};


export async function releaseCertificatesNow(eventId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${eventId}/release_certificates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const contentType = response.headers.get("Content-Type");

    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Unexpected response format: ${text}`);
    }

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to release certificates" };
    }

    console.log("Input JSON:", JSON.stringify(data, null, 2));

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: errorMessage };
  }
}
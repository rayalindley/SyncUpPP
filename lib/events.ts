"use server";
import { createClient } from "@/lib/supabase/server";

export async function insertEvent(formData: any, organizationId: string) {
  const insertValues = {
    title: formData.title,
    description: formData.description,
    eventdatetime: formData.eventdatetime, // Assuming this is a time string in HH:MM format
    location: formData.location,
    capacity: formData.capacity,
    registrationfee: formData.registrationfee,
    privacy: formData.privacy,
    organizationid: organizationId, // Include organizationId in the insertValues object
    eventphoto: formData.eventphoto,
    tags: formData.tags,
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

export async function fetchEvents(
  organizationId: string,
  currentPage: number,
  eventsPerPage: number
) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("organizationid", organizationId)
      .range(currentPage * eventsPerPage - eventsPerPage, currentPage * eventsPerPage)
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
    eventdatetime: formData.eventdatetime, // Assuming this is a time string in HH:MM format
    location: formData.location,
    capacity: formData.capacity,
    registrationfee: formData.registrationfee,
    privacy: formData.privacy,
    eventphoto: formData.eventphoto,
    tags: formData.tags,
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
  } catch (e) {
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

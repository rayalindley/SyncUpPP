// services/EventService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Event, Events } from "@/models/Event";

export class EventService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createEvent(event: Event): Promise<Event> {
    const { data, error } = await this.supabase
      .from("events")
      .insert(event)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new Event(
      data.eventId,
      data.title,
      data.description,
      data.organizationId,
      new Date(data.eventDate),
      data.location,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from("events")
      .select("*")
      .eq("eventId", eventId)
      .single();
    if (error) return null;
    return new Event(
      data.eventId,
      data.title,
      data.description,
      data.organizationId,
      new Date(data.eventDate),
      data.location,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from("events")
      .update(updates)
      .eq("eventId", eventId)
      .select()
      .single();
    if (error) return null;
    return new Event(
      data.eventId,
      data.title,
      data.description,
      data.organizationId,
      new Date(data.eventDate),
      data.location,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await this.supabase.from("events").delete().eq("eventId", eventId);
    if (error) throw new Error(error.message);
  }

  async getEventsByOrganization(orgId: string): Promise<Events[]> {
    const { data, error } = await this.supabase.rpc("get_events_by_organization", {
      org_id: orgId,
    });
    if (error) throw new Error(error.message);
    return data.map(
      (event: any) =>
        new Events(
          event.eventId,
          event.organizationId,
          event.title,
          event.description,
          new Date(event.eventDateTime),
          event.location,
          event.registrationFee,
          new Date(event.createdAt),
          event.capacity,
          event.adminId,
          event.privacy,
          event.eventPhoto,
          event.tags,
          event.eventSlug
        )
    );
  }
}

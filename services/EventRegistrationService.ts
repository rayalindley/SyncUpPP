// services/EventRegistrationService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { EventRegistration } from "../models/EventRegistration";

export class EventRegistrationService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createEventRegistration(
    eventRegistration: EventRegistration
  ): Promise<EventRegistration> {
    const { data, error } = await this.supabase
      .from("eventregistrations")
      .insert(eventRegistration)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new EventRegistration(
      data.eventRegistrationId,
      data.eventId,
      data.organizationMemberId,
      new Date(data.registrationDate),
      data.status,
      data.userId
    );
  }

  async getEventRegistrationById(
    eventRegistrationId: string
  ): Promise<EventRegistration | null> {
    const { data, error } = await this.supabase
      .from("eventregistrations")
      .select("*")
      .eq("eventRegistrationId", eventRegistrationId)
      .select()
      .single();
    if (error) return null;
    return new EventRegistration(
      data.eventRegistrationId,
      data.eventId,
      data.organizationMemberId,
      new Date(data.registrationDate),
      data.status,
      data.userId
    );
  }

  async updateEventRegistration(
    eventRegistrationId: string,
    updates: Partial<EventRegistration>
  ): Promise<EventRegistration | null> {
    const { data, error } = await this.supabase
      .from("eventregistrations")
      .update(updates)
      .eq("eventRegistrationId", eventRegistrationId)
      .select()
      .single();
    if (error) return null;
    return new EventRegistration(
      data.eventRegistrationId,
      data.eventId,
      data.organizationMemberId,
      new Date(data.registrationDate),
      data.status,
      data.userId
    );
  }

  async deleteEventRegistration(eventRegistrationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("eventregistrations")
      .delete()
      .eq("eventRegistrationId", eventRegistrationId);
    if (error) throw new Error(error.message);
  }
}

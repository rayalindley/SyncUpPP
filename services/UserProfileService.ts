// services/UserProfileService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { UserProfile } from "../models/UserProfile";

export class UserProfileService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createUserProfile(userProfile: UserProfile): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from("userprofiles")
      .insert(userProfile)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new UserProfile(
      data.userId,
      data.firstName,
      data.lastName,
      data.gender,
      new Date(data.dateOfBirth),
      data.description,
      data.company,
      data.profilePicture,
      data.website,
      new Date(data.updatedAt),
      data.id
    );
  }

  async getUserProfileById(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from("userprofiles")
      .select("*")
      .eq("userId", userId)
      .single();
    if (error) return null;
    return new UserProfile(
      data.userId,
      data.firstName,
      data.lastName,
      data.gender,
      new Date(data.dateOfBirth),
      data.description,
      data.company,
      data.profilePicture,
      data.website,
      new Date(data.updatedAt),
      data.id
    );
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from("userprofiles")
      .update(updates)
      .eq("userId", userId)
      .select()
      .single();
    if (error) return null;
    return new UserProfile(
      data.userId,
      data.firstName,
      data.lastName,
      data.gender,
      new Date(data.dateOfBirth),
      data.description,
      data.company,
      data.profilePicture,
      data.website,
      new Date(data.updatedAt),
      data.id
    );
  }

  async deleteUserProfile(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("userprofiles")
      .delete()
      .eq("userId", userId);
    if (error) throw new Error(error.message);
  }

  async updateUserProfileById(
    userId: string,
    updatedData: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const { data, error } = await this.supabase.rpc("update_user_profile_by_id", {
      user_id: userId,
      updated_data: updatedData,
    });
    if (error) return null;
    return new UserProfile(
      data.userid,
      data.first_name,
      data.last_name,
      data.gender,
      new Date(data.dateofbirth),
      data.description,
      data.company,
      data.profilepicture,
      data.website,
      new Date(data.updatedat),
      data.id
    );
  }
}

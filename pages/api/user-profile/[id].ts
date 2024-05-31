// pages/api/user-profile/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { UserProfileService } from "@/services/UserProfileService";
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
const userProfileService = new UserProfileService(supabase);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const userProfile = await userProfileService.getUserProfileById(id as string);
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.status(200).json(userProfile);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else if (req.method === "PUT") {
    try {
      const updatedData = req.body;
      const updatedUserProfile = await userProfileService.updateUserProfileById(
        id as string,
        updatedData
      );
      if (!updatedUserProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.status(200).json(updatedUserProfile);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

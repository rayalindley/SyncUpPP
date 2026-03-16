// pages/api/feedback-form/create.ts

import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { event_id, slug } = req.body;

  if (!event_id || !slug) {
    return res.status(400).json({ message: "event_id and slug are required" });
  }

  const supabase = createClient();

  // Check if a form already exists for this event slug
  const { data: existingForm, error: fetchError } = await supabase
    .from("forms")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ message: fetchError.message });
  }

  if (existingForm) {
    return res.status(200).json({ message: "Form already exists", form: existingForm });
  }

  // Insert a new feedback form
  const { data: newForm, error: insertError } = await supabase
    .from("forms")
    .insert([{ event_id, slug }])
    .select()
    .single();

  if (insertError || !newForm) {
    return res.status(500).json({ message: insertError?.message || "Failed to create form" });
  }

  return res.status(201).json(newForm);
}
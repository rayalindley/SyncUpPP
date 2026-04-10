import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types/questions";

const supabase = createClient();

export async function saveFormTemplate(name: string, questions: Question[], userId: string) {
  const { data, error } = await supabase
    .from("form_templates")
    .insert([
      { 
        name, 
        user_id: userId, 
        questions: questions // Stored directly as JSONB
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFormTemplates(userId: string) {
  const { data, error } = await supabase
    .from("form_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteFormTemplate(templateId: string) {
  const { error } = await supabase
    .from("form_templates")
    .delete()
    .eq("id", templateId);

  if (error) throw error;
}

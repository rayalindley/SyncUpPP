// Filename: lib/certificates.ts

import { createClient } from "@/lib/supabase/client";

/**
 * Interface for Certificate Template Data
 */
interface CertificateTemplateData {
  template_id?: string; // Optional when creating a new template
  template_name: string;
  template_content: object; // Parsed JSON object
  background_url: string | null;
  automatic_release?: boolean;
  organization_id: string;
  created_by: string; // Admin user ID who created/updated the template
}

/**
 * Interface for Event Certificate Settings
 */
interface EventCertificateSettings {
  event_id: string;
  certificate_template_id: string | null;
  automatic_release: boolean;
}

/**
 * Function to create a new certificate template
 */
export async function createCertificateTemplate(templateData: CertificateTemplateData) {
  const supabase = createClient();

  const { data, error } = await supabase.from("certificate_templates").insert([
    {
      template_name: templateData.template_name,
      template_content: templateData.template_content,
      background_url: templateData.background_url,
      automatic_release: templateData.automatic_release ?? false,
      organization_id: templateData.organization_id,
      created_by: templateData.created_by,
    },
  ]);

  return { data, error };
}

/**
 * Function to update an existing certificate template
 * @param templateId - The UUID of the certificate template to update
 * @param templateData - The data to update the template with
 */
export async function updateCertificateTemplate(
  templateId: string,
  templateData: CertificateTemplateData
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("certificate_templates")
    .update({
      template_name: templateData.template_name,
      template_content: templateData.template_content,
      background_url: templateData.background_url,
      automatic_release: templateData.automatic_release ?? false,
      // Note: Typically, you don't update organization_id or created_by when updating a template
    })
    .eq("template_id", templateId);

  return { data, error };
}

/**
 * Function to fetch all certificate templates for an organization
 * @param organizationId - The UUID of the organization
 */
export async function fetchCertificateTemplates(organizationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("certificate_templates")
    .select("*")
    .eq("organization_id", organizationId);

  return { data, error };
}

/**
 * Function to fetch a single certificate template by ID
 * @param templateId - The UUID of the certificate template
 */
export async function fetchCertificateTemplateById(templateId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("certificate_templates")
    .select("*")
    .eq("template_id", templateId)
    .single();

  return { data, error };
}

/**
 * Function to delete a certificate template by ID
 * @param templateId - The UUID of the certificate template
 */
export async function deleteCertificateTemplate(templateId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("certificate_templates")
    .delete()
    .eq("template_id", templateId);

  return { data, error };
}

/**
 * Function to fetch certificate settings for a specific event
 * @param eventId - The UUID of the event
 */
export async function fetchEventCertificateSettings(eventId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_certificate_settings")
    .select("*")
    .eq("event_id", eventId)
    .single(); // Assuming each event has only one certificate setting

  return { data, error };
}

/**
 * Function to update certificate settings for a specific event
 * @param eventId - The UUID of the event
 * @param settings - The certificate settings to update
 */
export async function updateEventCertificateSettings(
  eventId: string,
  settings: {
    certificate_template_id: string | null;
    automatic_release: boolean;
  }
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("event_certificate_settings")
    .upsert(
      {
        event_id: eventId,
        certificate_template_id: settings.certificate_template_id,
        automatic_release: settings.automatic_release,
      },
      { onConflict: "event_id" } // Ensure upsert uses event_id as the unique key
    );

  return { data, error };
}


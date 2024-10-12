// Filename: components/app/CertificatesTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  fetchCertificateTemplates,
  fetchEventCertificateSettings,
  updateEventCertificateSettings,
} from "@/lib/certificates";
import Swal from "sweetalert2";

interface CertificatesTabProps {
  eventId: string;
  organizationId: string;
  userId: string; // Although not used in this component, included for completeness
}

interface CertificateTemplate {
  template_id: string;
  template_name: string;
}

const CertificatesTab: React.FC<CertificatesTabProps> = ({ eventId, organizationId }) => {
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [automaticRelease, setAutomaticRelease] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch certificate templates
    const fetchTemplates = async () => {
      const { data, error } = await fetchCertificateTemplates(organizationId);
      if (!error) {
        setCertificateTemplates(data || []);
      } else {
        Swal.fire("Error", error.message, "error");
      }
    };
    fetchTemplates();
  }, [organizationId]);

  useEffect(() => {
    // Fetch event certificate settings
    const fetchSettings = async () => {
      const { data, error } = await fetchEventCertificateSettings(eventId);
      if (!error && data) {
        setSelectedTemplateId(data.certificate_template_id);
        setAutomaticRelease(data.automatic_release);
      }
    };
    fetchSettings();
  }, [eventId]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    const settings = {
      certificate_template_id: selectedTemplateId || null,
      automatic_release: automaticRelease,
    };

    const { error } = await updateEventCertificateSettings(eventId, settings);
    if (!error) {
      Swal.fire("Success", "Certificate settings saved.", "success");
    } else {
      Swal.fire("Error", error.message, "error");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Certificate Settings</h2>
      <div>
        <label className="block mb-2">Select Certificate Template</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="block w-full rounded-md border border-charleston bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
        >
          <option value="">Select a template</option>
          {certificateTemplates.map((template) => (
            <option key={template.template_id} value={template.template_id}>
              {template.template_name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={automaticRelease}
          onChange={(e) => setAutomaticRelease(e.target.checked)}
          className="form-checkbox h-5 w-5 text-primary"
        />
        <label className="ml-2">Enable Automatic Release After Event</label>
      </div>
      <button
        onClick={handleSaveSettings}
        disabled={isLoading}
        className={`rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default CertificatesTab;

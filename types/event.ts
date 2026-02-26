import { Privacy } from "./privacy";

export interface CertificateSettings {
  certificate_enabled: boolean;
  release_option?: string;
  scheduled_release_date?: string | null;
}

export interface Event {
  eventid: string;          // PRIMARY KEY
  eventphoto: string;
  title: string;
  description: string;
  registrationfee: number;
  starteventdatetime: string;
  endeventdatetime: string;
  location: string;
  capacity: number;
  organizationid: string;
  eventslug: string;
  imageUrl: string;
  tags: string[];
  privacy: Privacy;
  createdat: string;
  selected?: boolean;
  onsite?: boolean;
  status?: string;
  has_feedback_form?: boolean;
}

import { Privacy } from "./privacy";

export interface CertificateSettings {
  certificate_enabled: boolean;
  release_option: "disabled" | "immediate" | "after_event" | "scheduled";
  scheduled_release_date: Date | null;
}

export interface Event {
  users?: never[];
  id: string;
  eventid: string;
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
  createdat: Date;
  selected?: boolean;
  onsite?: boolean;
  status?: string;
}

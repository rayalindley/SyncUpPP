import { Privacy } from "./privacy";

export interface Event {
  users?: never[];
  id: string;
  eventid: string;
  eventphoto: string;
  title: string;
  description: string;
  registrationfee: number;
  starteventdatetime: Date;
  endeventdatetime: Date;
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

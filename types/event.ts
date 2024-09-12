
export interface Event {
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
  privacy: string;
  createdat: Date;
  selected?: boolean;
}

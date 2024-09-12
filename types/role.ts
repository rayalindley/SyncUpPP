import { Member } from '@/types/member';

export interface Role {
  role_id: string;
  role: string;
  color: string;
  member_count?: number;
  org_id: string;
  deletable: boolean;
  editable?: boolean;
  members?: Member[];
}

import { Organizations } from '@/types/organizations';

export interface OrganizationRoles {
  role_id: string;
  org_id: string;
  role: string;
  color?: string;
  deletable: boolean;
  editable?: boolean;
  organizations?: Organizations;
}

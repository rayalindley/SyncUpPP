import { OrganizationRoles } from '@/types/organization_roles';
import { Permissions } from '@/types/permissions';

export interface RolePermissions {
  role_id: string;
  perm_id: string;
  organization_roles?: OrganizationRoles;
  permissions?: Permissions;
}

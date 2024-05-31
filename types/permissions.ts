import { Organization_roles } from "./roles";

export interface Permissions {
  perm_id: string;
  category?: string;
  name: string;
  description?: string;
}

export interface Role_permissions {
  role_id: string;
  perm_id: string;
  organization_roles?: Organization_roles;
  permissions?: Permissions;
}

import { Organization_roles } from "./roles";

export interface Permissions {
  perm_id: string /* primary key */;
  category?: string;
  name: string;
  description?: string;
}

export interface Role_permissions {
  role_id: string /* primary key */ /* foreign key to organization_roles.role_id */;
  perm_id: string /* primary key */ /* foreign key to permissions.perm_id */;
  organization_roles?: Organization_roles;
  permissions?: Permissions;
}

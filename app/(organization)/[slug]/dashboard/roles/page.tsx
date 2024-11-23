import { createClient, getUser } from "@/lib/supabase/server";
import { check_permissions } from "@/lib/organization";
import RolesClientComponent from "@/components/settings/RolesClientComponent";
import { redirect } from "next/navigation";

export default async function SettingsRolesPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const supabase = createClient();

  if (slug) {
    try {
      const { data: organization, error: orgError } = await supabase
        .from("organization_roles_view")
        .select("*")
        .eq("slug", slug)
        .single();

      const { data: permissions, error: permissionsError } = await supabase
        .from("permissions")
        .select("*");

      if (!organization || orgError || !permissions || permissionsError) {
        return null;
      }

      const user = await getUser();

      if (user && organization) {
        const userId = user.user?.id || "";
        const [
          viewPermission,
          editPermission,
          deletePermission,
          assignPermission,
          createPermission,
        ] = await Promise.all([
          check_permissions(userId, organization.organizationid, "view_dashboard"),
          check_permissions(userId, organization.organizationid, "edit_roles"),
          check_permissions(userId, organization.organizationid, "delete_roles"),
          check_permissions(userId, organization.organizationid, "assign_permissions"),
          check_permissions(userId, organization.organizationid, "create_roles"),
        ]);

        if (!viewPermission) {
          redirect("/dashboard");
        }

        return (
          <RolesClientComponent
            organization={organization}
            permissionsData={permissions}
            userPermissions={{
              canViewDashboard: viewPermission,
              canEditRoles: editPermission,
              canDeleteRoles: deletePermission,
              canAssignPermissions: assignPermission,
              canCreateRoles: createPermission,
            }}
          />
        );
      }
    } catch (error) {
      return null;
    }
  }

  return null;
}

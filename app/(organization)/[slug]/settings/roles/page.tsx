"use client";
import { Members } from "@/components/settings/role_members_tab";
import { RoleDisplay } from "@/components/settings/role_display_tab";
import { createClient } from "@/lib/supabase/client";
import { Menu, Switch, Tab } from "@headlessui/react";
import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Role {
  role_id: string;
  role: string;
  color: string;
  member_count: number;
  org_id: string;
  deletable: boolean; // Add this property to the Role interface
}

interface Permission {
  perm_id: string;
  name: string;
  category: string;
  description: string;
}

interface Organization {
  roles: Role[];
}

export default function SettingsRolesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionsData, setPermissionsData] = useState<{ [key: string]: Permission[] }>(
    {}
  );
  const [permissionsEnabled, setPermissionsEnabled] = useState<{
    [role_id: string]: { [perm_id: string]: boolean };
  }>({});
  const [rolesData, setRolesData] = useState<Role[] | null>(null);
  const [filteredRoles, setFilteredRoles] = useState<Role[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [orgID, setOrgID] = useState<string | null>(null);
  const { slug } = useParams();

  useEffect(() => {
    const supabase = createClient();

    if (slug) {
      (async () => {
        try {
          const { data: organization, error: orgError } = await supabase
            .from("organization_roles_view")
            .select("*")
            .eq("slug", slug)
            .single();

          const { data: permissions, error: permissionsError } = await supabase
            .from("permissions")
            .select("*");

          if (permissions) {
            const groupedPermissions = permissions.reduce(
              (acc: { [key: string]: Permission[] }, permission: Permission) => {
                const { category } = permission;
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(permission);
                return acc;
              },
              {}
            );

            setPermissionsData(groupedPermissions);
          } else {
            if (permissionsError) {
              console.log(permissionsError);
            }
          }

          if (organization) {
            const roleIds = organization.roles.map((role: Role) => role.role_id);
            const { data: rolePermissions, error: rolePermissionsError } = await supabase
              .from("role_permissions")
              .select("*")
              .in("role_id", roleIds);

            setOrgID(organization.organizationid);

            if (rolePermissions) {
              const permissionsEnabledState = rolePermissions.reduce(
                (
                  acc: { [role_id: string]: { [perm_id: string]: boolean } },
                  rp: { role_id: string; perm_id: string }
                ) => {
                  acc[rp.role_id] = acc[rp.role_id] || {};
                  acc[rp.role_id][rp.perm_id] = true;
                  return acc;
                },
                {}
              );

              setPermissionsEnabled(permissionsEnabledState);
            } else {
              if (rolePermissionsError) {
                console.log(rolePermissionsError);
              }
            }

            setRolesData(organization.roles);
            setFilteredRoles(organization.roles);
          } else {
            console.log("Error:", orgError);
          }
        } catch (xError) {
          console.log(xError);
        }
      })();
    }
  }, [slug]);

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setSelectedIndex(1);
  };

  const handleSidebarClose = () => {
    setSelectedRole(null);
  };

  const handleSaveChanges = async (formValues: Role) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("organization_roles")
        .update({
          role: formValues.role,
          color: formValues.color,
        })
        .eq("role_id", formValues.role_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setRolesData((prevRolesData) =>
        prevRolesData
          ? prevRolesData.map((role) =>
              role.role_id === formValues.role_id ? formValues : role
            )
          : null
      );
      setFilteredRoles((prevRolesData) =>
        prevRolesData
          ? prevRolesData.map((role) =>
              role.role_id === formValues.role_id ? formValues : role
            )
          : null
      );
      setSelectedRole(formValues);
      toast.success("Changes saved successfully!", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error: any) {
      toast.error(error.message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const handleDeleteRole = async (role: Role) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("organization_roles")
        .delete()
        .eq("role_id", role.role_id);

      if (error) {
        throw error;
      }

      setRolesData((prevRolesData) =>
        prevRolesData ? prevRolesData.filter((r) => r.role_id !== role.role_id) : null
      );
      setFilteredRoles((prevRolesData) =>
        prevRolesData ? prevRolesData.filter((r) => r.role_id !== role.role_id) : null
      );
      setSelectedRole(null);
      console.log("Role deleted");
      toast.success("The role was delete successfully.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error: any) {
      setSelectedRole(null);
      toast.error(error.message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const handlePermissionToggle = async (permId: string) => {
    const supabase = createClient();

    if (selectedRole) {
      setPermissionsEnabled((prev) => {
        const updatedPermissions = {
          ...prev,
          [selectedRole.role_id]: {
            ...prev[selectedRole.role_id],
            [permId]: !prev[selectedRole.role_id]?.[permId],
          },
        };

        return updatedPermissions;
      });

      if (!permissionsEnabled[selectedRole.role_id]?.[permId]) {
        const { data, error } = await supabase
          .from("role_permissions")
          .insert([{ role_id: selectedRole.role_id, perm_id: permId }])
          .select()
          .single();

        if (error) console.log(error);
      } else {
        const { data, error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", selectedRole.role_id)
          .eq("perm_id", permId)
          .select()
          .single();

        if (error) console.log(error);
      }
    }
  };

  const handleAddRole = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("organization_roles")
      .insert([
        {
          org_id: orgID,
          role: "new role",
          color: "Silver",
          editable: true,
          deletable: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.log(error);
    } else {
      setRolesData((prevRoles) => (prevRoles ? [...prevRoles, data] : [data]));
      setFilteredRoles((prevRoles) => (prevRoles ? [...prevRoles, data] : [data]));
      setSelectedRole(data);
      setSelectedIndex(0);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredRoles(
      rolesData?.filter((role) => role.role.toLowerCase().includes(query)) || null
    );
  };

  const handleMemberClick = (role: Role) => {
    setSelectedRole(role);
    setSelectedIndex(2);
  };

  return (
    <div className="bg-eerieblack p-6 text-white">
      <ToastContainer />

      <h1 className="mb-2 text-xl font-medium">Roles</h1>
      <p className="mb-4 text-sm">Manage and configure roles for your organization.</p>

      <div className="mb-4 flex gap-1">
        <input
          type="text"
          placeholder="Search roles..."
          className="flex-grow rounded-md border border-raisinblack bg-charleston p-2 px-4 text-sm text-light placeholder-opacity-50 placeholder:text-light"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button
          className="rounded-md bg-primary p-2 px-4 text-sm hover:bg-primarydark"
          onClick={handleAddRole}
        >
          Create Role
        </button>
      </div>

      <div className="rounded py-4">
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">ROLES</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">MEMBERS</th>
              <th className="px-4 py-2 text-center text-sm font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles?.map((role) => (
              <tr
                key={role.role_id}
                className="border-b border-t border-[#525252] hover:bg-charleston"
              >
                <td
                  className="px-4 py-4 hover:cursor-pointer"
                  onClick={() => handleRoleClick(role)}
                >
                  <div className="flex items-center text-sm">
                    <UserCircleIcon
                      className="mr-2 h-6 w-6"
                      style={{ color: role.color }}
                    />
                    {role.role}
                  </div>
                </td>
                <td
                  className="px-4 py-4 hover:cursor-pointer"
                  onClick={() => handleMemberClick(role)}
                >
                  <div className="flex items-center">
                    <UsersIcon className="mr-2 h-6 w-6" />
                    {role.member_count || 0}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button>
                      <EllipsisHorizontalIcon className="h-6 w-6" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-1 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`${
                                active ? "bg-primary text-white" : "text-gray-900"
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                              onClick={() => handleRoleClick(role)}
                            >
                              Edit Role
                            </button>
                          )}
                        </Menu.Item>
                        {role.deletable && (
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? "bg-primary text-white" : "text-gray-900"
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                onClick={() => handleDeleteRole(role)}
                              >
                                Delete Role
                              </button>
                            )}
                          </Menu.Item>
                        )}
                      </div>
                    </Menu.Items>
                  </Menu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRole && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-[calc(100%-18rem)] bg-eerieblack">
          <div className="w-64 border-r border-[#525252] bg-eerieblack p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSidebarClose}
                className="mb-4 mt-2 flex items-center text-white"
              >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                <span>Back</span>
              </button>
              <div>
                <button
                  className="rounded-sm p-1 hover:bg-charleston"
                  onClick={handleAddRole}
                >
                  <FiPlus size={18} />
                </button>
              </div>
            </div>
            {rolesData?.map((role) => (
              <div
                key={role.role_id}
                className={`mb-2 flex cursor-pointer items-center rounded p-2 ${
                  selectedRole.role_id === role.role_id
                    ? "bg-charleston"
                    : "hover:bg-charleston"
                }`}
                onClick={() => handleRoleClick(role)}
              >
                <span
                  className="mr-2 inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="text-sm">{role.role}</span>
              </div>
            ))}
          </div>
          <div className="flex-grow overflow-y-auto bg-raisinblack py-6 pl-10 pr-10">
            <h2 className="mb-4 text-lg font-medium">EDIT ROLE - {selectedRole.role}</h2>
            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
              <Tab.List className="border-b border-gray-700">
                {["Display", "Permissions", "Members"].map((tab, index) => (
                  <Tab
                    key={tab}
                    className={({ selected }) =>
                      `inline-block cursor-pointer px-4 py-2 text-sm font-medium leading-5 ${
                        selected
                          ? "border-primary text-primary"
                          : "text-white hover:text-primary"
                      } ${selected ? "border-b-2" : ""}`
                    }
                  >
                    {tab}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <RoleDisplay
                    selectedRole={selectedRole}
                    handleSaveChanges={handleSaveChanges}
                    handleDeleteRole={handleDeleteRole}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  {Object.entries(permissionsData).map(([category, permissions]) => (
                    <div key={category}>
                      <h3 className="mb-4 mt-10 text-base font-medium">
                        {category.toUpperCase()}
                      </h3>
                      {permissions.map((perm) => (
                        <div
                          key={perm.perm_id}
                          className="mb-6 flex items-center justify-between border-b border-[#525252] pb-4"
                        >
                          <div className="flex-grow">
                            <p className="mb-2 text-base">{perm.name}</p>
                            <p className="text-sm text-gray-400">{perm.description}</p>
                          </div>
                          <Switch
                            checked={
                              permissionsEnabled[selectedRole.role_id]?.[perm.perm_id] ||
                              false
                            }
                            onChange={() => handlePermissionToggle(perm.perm_id)}
                            className={`${
                              permissionsEnabled[selectedRole.role_id]?.[perm.perm_id]
                                ? "bg-primary"
                                : "bg-gray-200"
                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                          >
                            <span className="sr-only">Use setting</span>
                            <span
                              className={`${
                                permissionsEnabled[selectedRole.role_id]?.[perm.perm_id]
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                          </Switch>
                        </div>
                      ))}
                    </div>
                  ))}
                </Tab.Panel>
                <Tab.Panel>
                  <Members selectedRole={selectedRole} organizationId={orgID} />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      )}
    </div>
  );
}

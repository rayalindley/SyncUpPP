"use client";
import { RoleDisplay } from "@/components/settings/role_display_tab";
import { Members } from "@/components/settings/role_members_tab";
import { createClient } from "@/lib/supabase/client";
import { Menu, Switch, Tab } from "@headlessui/react";
import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { z } from "zod";
import { Role } from "@/types/role";
import { Member } from "@/types/member";
import { recordActivity } from "@/lib/track";

interface Permission {
  perm_key: string;
  name: string;
  category: string;
  description: string;
}

interface RolesClientComponentProps {
  organization: any;
  permissionsData: Permission[];
  userPermissions: {
    canViewDashboard: boolean;
    canEditRoles: boolean;
    canDeleteRoles: boolean;
    canAssignPermissions: boolean;
    canCreateRoles: boolean;
  };
}

const emailSchema = z.string().email("Invalid email address");
const inviteSchema = z.object({
  emails: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one email is required"),
  roleId: z.string().min(1, "A role must be selected"),
});

export default function RolesClientComponent({
  organization,
  permissionsData,
  userPermissions,
}: RolesClientComponentProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissionsEnabled, setPermissionsEnabled] = useState<{
    [role_id: string]: { [perm_key: string]: boolean };
  }>({});
  const [rolesData, setRolesData] = useState<Role[] | null>(null);
  const [filteredRoles, setFilteredRoles] = useState<Role[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [orgID, setOrgID] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmailsInput, setInviteEmailsInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [selectedInviteRole, setSelectedInviteRole] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState(0);

  const {
    canViewDashboard,
    canEditRoles,
    canDeleteRoles,
    canAssignPermissions,
    canCreateRoles,
  } = userPermissions;

  const params = useParams() as { slug: string };
  const slug = params.slug;
  const router = useRouter();

  const [groupedPermissions, setGroupedPermissions] = useState<{
    [key: string]: Permission[];
  }>({});

  useEffect(() => {
    if (organization && permissionsData) {
      const roleIds = organization.roles.map((role: Role) => role.role_id);

      setOrgID(organization.organizationid);
      setRolesData(organization.roles as Role[]);
      setFilteredRoles(organization.roles as Role[]);

      const grouped = permissionsData.reduce(
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
      setGroupedPermissions(grouped);

      const supabase = createClient();

      (async () => {
        const { data: rolePermissions } = await supabase
          .from("role_permissions")
          .select("*")
          .in("role_id", roleIds);

        if (rolePermissions) {
          const permissionsEnabledState = rolePermissions.reduce(
            (
              acc: { [role_id: string]: { [perm_key: string]: boolean } },
              rp: { role_id: string; perm_key: string }
            ) => {
              if (!acc[rp.role_id]) {
                acc[rp.role_id] = {};
              }
              acc[rp.role_id][rp.perm_key] = true;
              return acc;
            },
            {}
          );
          setPermissionsEnabled(permissionsEnabledState);
        }
      })();
    }
  }, [organization, permissionsData]);

  const handleRoleClick = (role: Role) => {
    if (canEditRoles) {
      setSelectedRole(role);
    } else {
      toast.error("You do not have permission to edit roles.", {
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

  const handleSidebarClose = () => {
    setSelectedRole(null);
  };

  const handleSaveChanges = async (formValues: Role): Promise<void> => {
    const supabase = createClient();
    if (!canEditRoles) {
      toast.error("You do not have permission to edit roles.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
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
      await recordActivity({
        activity_type: "role_update",
        description: `User has updated the role: ${data.role}.`,
        organization_id: orgID,
        activity_details: data,
      });
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
    if (!canDeleteRoles) {
      toast.error("You do not have permission to delete roles.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from("organization_roles")
        .delete()
        .eq("role_id", role.role_id);
      await recordActivity({
        activity_type: "role_delete",
        description: `User has deleted the role: ${role.role}.`,
        organization_id: orgID,
      });
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
      toast.success("The role was deleted successfully.", {
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

  const handlePermissionToggle = async (permKey: string) => {
    const supabase = createClient();
    if (!canAssignPermissions) {
      toast.error("You do not have permission to assign permissions.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    if (selectedRole) {
      const isEnabled = permissionsEnabled[selectedRole.role_id]?.[permKey] || false;
      setPermissionsEnabled((prev) => {
        const updatedPermissions = {
          ...prev,
          [selectedRole.role_id]: {
            ...prev[selectedRole.role_id],
            [permKey]: !isEnabled,
          },
        };
        return updatedPermissions;
      });
      if (!isEnabled) {
        await supabase
          .from("role_permissions")
          .insert([{ role_id: selectedRole.role_id, perm_key: permKey }])
          .select()
          .single();
      } else {
        await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", selectedRole.role_id)
          .eq("perm_key", permKey)
          .select()
          .single();
      }
    }
  };

  const handleAddRole = async () => {
    const supabase = createClient();
    if (!canCreateRoles) {
      toast.error("You do not have permission to create roles.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
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
    if (!error) {
      await recordActivity({
        activity_type: "role_create",
        description: `User has created a new role: ${data.role}.`,
        organization_id: orgID,
        activity_details: data,
      });
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

  const handleRoleMembersUpdate = (updatedMembers: Member[], roleId: string) => {
    setRolesData((prevRolesData) =>
      prevRolesData
        ? prevRolesData.map((role) =>
            role.role_id === roleId ? { ...role, members: updatedMembers } : role
          )
        : null
    );
    setFilteredRoles((prevRolesData) =>
      prevRolesData
        ? prevRolesData.map((role) =>
            role.role_id === roleId ? { ...role, members: updatedMembers } : role
          )
        : null
    );
    if (selectedRole && selectedRole.role_id === roleId) {
      setSelectedRole((prevRole) =>
        prevRole ? { ...prevRole, members: updatedMembers } : null
      );
    }
  };

  const handleMoveMember = async (memberId: string, newRoleId: string) => {
    const supabase = createClient();
    await supabase
      .from("organizationmembers")
      .update({ roleid: null })
      .eq("organizationid", orgID)
      .eq("userid", memberId);
    await supabase
      .from("organizationmembers")
      .update({ roleid: newRoleId })
      .eq("organizationid", orgID)
      .eq("userid", memberId);
    const { data: member } = await supabase
      .from("userprofiles")
      .select("first_name")
      .eq("userid", memberId)
      .single();
    const { data: newRole } = await supabase
      .from("organization_roles")
      .select("role")
      .eq("role_id", newRoleId)
      .single();
    await recordActivity({
      activity_type: "role_member_update",
      description: `${member?.first_name} has been moved to the ${newRole?.role} role.`,
      organization_id: orgID,
    });
    setRolesData((prevRolesData) => {
      if (!prevRolesData) return null;
      const updatedRoles = prevRolesData.map((role) => {
        if (role.members?.some((member) => member.userid === memberId)) {
          return {
            ...role,
            members: role.members.filter((member) => member.userid !== memberId),
          };
        } else if (role.role_id === newRoleId) {
          return {
            ...role,
            members: [...(role.members || []), { userid: memberId } as Member],
          };
        }
        return role;
      });
      if (selectedRole) {
        const updatedSelectedRole = updatedRoles.find(
          (role) => role.role_id === selectedRole.role_id
        );
        setSelectedRole(updatedSelectedRole || null);
      }
      return updatedRoles;
    });
  };

  const handleInvite = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteEmailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteEmailsInput(e.target.value);
    setEmailError(null);
  };

  const processEmails = (emailString: string) => {
    const emailsArray = emailString
      .split(/[\s,]+/)
      .filter((email) => email.trim() !== "");
    const newValidEmails: string[] = [];
    let errors: string[] = [];
    emailsArray.forEach((email) => {
      try {
        emailSchema.parse(email);
        if (!inviteEmails.includes(email) && !newValidEmails.includes(email)) {
          newValidEmails.push(email);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(`${email}: ${error.errors[0].message}`);
        }
      }
    });
    if (newValidEmails.length > 0) {
      setInviteEmails((prev) => [...prev, ...newValidEmails]);
      setInviteEmailsInput("");
    }
    if (errors.length > 0) {
      setEmailError(errors.join(", "));
    }
  };

  const handleInviteEmailsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      processEmails(inviteEmailsInput);
    }
  };

  const handleInviteEmailsPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    processEmails(pastedText);
  };

  const removeInviteEmail = (emailToRemove: string) => {
    setInviteEmails(inviteEmails.filter((email) => email !== emailToRemove));
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmails([]);
    setInviteEmailsInput("");
    setEmailError(null);
    setSelectedInviteRole("");
  };

  const handleSendInvites = async () => {
    try {
      inviteSchema.parse({
        emails: inviteEmails,
        roleId: selectedInviteRole,
      });
      closeInviteModal();
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message, {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
        });
      } else {
        toast.error("An unexpected error occurred", {
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
    }
  };

  return (
    <div className="bg-eerieblack p-6 text-white">
      <ToastContainer autoClose={3000} />
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
        {canCreateRoles && (
          <button
            className="rounded-md bg-primary p-2 px-4 text-sm hover:bg-primarydark"
            onClick={handleAddRole}
          >
            Create Role
          </button>
        )}
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
                    {role.members ? role.members.length : 0}
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
                        {role.deletable && canDeleteRoles && (
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
                {canCreateRoles && (
                  <button
                    className="rounded-sm p-1 hover:bg-charleston"
                    onClick={handleAddRole}
                  >
                    <FiPlus size={18} />
                  </button>
                )}
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
            <h2 className="mb-4 text-lg font-medium">
              EDIT ROLE - {selectedRole.role}
            </h2>
            {canEditRoles ? (
              <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <Tab.List className="border-b border-gray-700">
                  {["Display", "Permissions", "Members"].map((tab) => (
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
                    {Object.entries(groupedPermissions).map(
                      ([category, permissions]) => (
                        <div key={category}>
                          <h3 className="mb-4 mt-10 text-base font-medium">
                            {category.toUpperCase()}
                          </h3>
                          {permissions.map((perm) => (
                            <div
                              key={perm.perm_key}
                              className="mb-6 flex items-center justify-between border-b border-[#525252] pb-4"
                            >
                              <div className="flex-grow">
                                <p className="mb-2 text-base">{perm.name}</p>
                                <p className="text-sm text-gray-400">
                                  {perm.description}
                                </p>
                              </div>
                              <Switch
                                checked={
                                  permissionsEnabled[selectedRole.role_id]?.[perm.perm_key] ||
                                  false
                                }
                                onChange={() => handlePermissionToggle(perm.perm_key)}
                                className={`${
                                  permissionsEnabled[selectedRole.role_id]?.[perm.perm_key]
                                    ? "bg-primary"
                                    : "bg-gray-200"
                                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                              >
                                <span className="sr-only">Use setting</span>
                                <span
                                  className={`${
                                    permissionsEnabled[selectedRole.role_id]?.[perm.perm_key]
                                      ? "translate-x-5"
                                      : "translate-x-0"
                                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                />
                              </Switch>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </Tab.Panel>
                  <Tab.Panel>
                    {selectedRole && orgID && (
                      <Members
                        selectedRole={selectedRole}
                        organizationid={orgID}
                        onRoleMembersUpdate={handleRoleMembersUpdate}
                        onMoveMember={handleMoveMember}
                      />
                    )}
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            ) : (
              <div>
                <p>You do not have permission to edit roles.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

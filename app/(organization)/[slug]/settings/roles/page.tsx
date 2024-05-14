"use client";
import { Switch } from "@headlessui/react";
import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";

const rolesData = [
  { id: 1, name: "Admin", memberCount: 10, color: "#ED4042" }, // Red color
  { id: 2, name: "Moderator", memberCount: 5, color: "#57A13A" }, // Green color
  { id: 3, name: "Member", memberCount: 100, color: "#09A9AF" }, // Blue color
];

const permissionsData = [
  {
    name: "Create Invite",
    category: "General Permissions",
    description: "Allows members to invite new people to the organization.",
  },
  {
    name: "Ban Members",
    category: "General Permissions",
    description: "Allows members to ban others from the organization.",
  },
  {
    name: "Kick Members",
    category: "General Permissions",
    description: "Allows members to kick others from the organization.",
  },
  {
    name: "Read Messages",
    category: "General Permissions",
    description: "Allows members to read messages in channels.",
  },
  {
    name: "Create Membership",
    category: "Membership Management",
    description: "Allows the creation of new membership plans.",
  },
  {
    name: "Edit Membership",
    category: "Membership Management",
    description: "Allows editing of existing membership plans.",
  },
  {
    name: "Delete Membership",
    category: "Membership Management",
    description: "Allows deletion of membership plans.",
  },
  {
    name: "Renew Membership",
    category: "Membership Management",
    description: "Allows renewal of membership plans.",
  },
  {
    name: "Delete Membership",
    category: "Roles Management",
    description: "Allows deletion of membership plans.",
  },
  {
    name: "Renew Membership",
    category: "Roles Management",
    description: "Allows renewal of membership plans.",
  },
  // ... (add any additional permissions here)
];

export default function SettingsRolesPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsEnabled, setPermissionsEnabled] = useState(
    permissionsData.reduce((acc, perm) => {
      acc[perm.name] = false;
      return acc;
    }, {})
  );

  const handleRoleClick = (role) => {
    setSelectedRole(role);
  };

  const handleSidebarClose = () => {
    setSelectedRole(null);
  };

  const groupedPermissions = permissionsData.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const handlePermissionToggle = (permName) => {
    setPermissionsEnabled((prev) => ({
      ...prev,
      [permName]: !prev[permName],
    }));
  };

  return (
    <div className=" bg-eerieblack p-6 text-white">
      <h1 className="mb-2 text-xl font-medium">Roles</h1>
      <p className="mb-4 text-sm">Manage and configure roles for your organization.</p>

      <div className="mb-4 flex">
        <input
          type="text"
          placeholder="Search roles..."
          className="flex-grow rounded-l border border-raisinblack bg-charleston p-2 text-light placeholder-opacity-50 placeholder:text-light"
        />
        <button className="rounded-r bg-primary p-2 hover:bg-primarydark">
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
            {rolesData.map((role) => (
              <tr
                key={role.id}
                className="border-b border-t border-[#525252] hover:bg-charleston"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center text-sm ">
                    <UserCircleIcon
                      className="mr-2 h-6 w-6"
                      style={{ color: role.color }}
                    />
                    {role.name}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <UsersIcon className="mr-2 h-6 w-6" />
                    {role.memberCount}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <button onClick={() => handleRoleClick(role)}>
                    <EllipsisHorizontalIcon className="h-6 w-6" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRole && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-[calc(100%-18rem)] bg-eerieblack">
          <div className="w-64 border-r border-[#525252] bg-eerieblack p-4 ">
            <button
              onClick={handleSidebarClose}
              className="mb-4 mt-2 flex items-center text-white"
            >
              <ArrowLeftIcon className="mr-2 h-5 w-5" />
              <span>Back</span>
            </button>
            {rolesData.map((role) => (
              <div
                key={role.id}
                className={`mb-2 flex cursor-pointer items-center rounded p-2 ${
                  selectedRole.id === role.id ? "bg-charleston" : "hover:bg-charleston"
                }`}
                onClick={() => handleRoleClick(role)}
              >
                <span
                  className="mr-2 inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="text-sm">{role.name}</span>
              </div>
            ))}
          </div>
          <div className="flex-grow overflow-y-auto bg-raisinblack py-6 pl-10 pr-10">
            <h2 className="mb-4 text-lg font-medium">EDIT ROLE - {selectedRole.name}</h2>
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category}>
                <h3 className="mb-4 mt-10 text-base font-medium">
                  {category.toUpperCase()}
                </h3>
                {permissions.map((perm) => (
                  <div
                    key={perm.name}
                    className="mb-6 flex items-center justify-between border-b border-[#525252] pb-4"
                  >
                    <div className="flex-grow">
                      <p className="mb-2 text-base">{perm.name}</p>
                      <p className="text-sm text-gray-400">{perm.description}</p>
                    </div>
                    <Switch
                      checked={permissionsEnabled[perm.name]}
                      onChange={() => handlePermissionToggle(perm.name)}
                      className={`${
                        permissionsEnabled[perm.name] ? "bg-primary" : "bg-gray-200"
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                    >
                      <span className="sr-only">Use setting</span>
                      <span
                        className={`${
                          permissionsEnabled[perm.name]
                            ? "translate-x-5"
                            : "translate-x-0"
                        } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

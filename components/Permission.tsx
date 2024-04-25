import React from "react";
import CustomRadioButtons from "./CustomRadioButtons";

const permissions = [
  { name: "My Account", description: "Manage your account settings" },
  { name: "Team Members", description: "Manage your team members" },
  { name: "Team Members", description: "Manage your team members" },
];

function Permission({ name, description }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <div className="mt-2">
          <p>{name}</p>
        </div>
        <div className="ml-auto">
          <CustomRadioButtons />
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default function PermissionList() {
  return (
    <div className="flex flex-col gap-4">
      {permissions.map((permission, index) => (
        <Permission
          key={index}
          name={permission.name}
          description={permission.description}
        />
      ))}
    </div>
  );
}

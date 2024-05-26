import { Role } from "@/types/roles";
import { useState, useEffect, ChangeEvent } from "react";
import { CirclePicker, ColorResult } from "react-color";
import * as z from "zod";

// Zod schema for validation
const RoleSchema = z.object({
  role: z
    .string()
    .min(3, "Role name must be at least 3 characters")
    .max(20, "Role name cannot be more than 20 characters"),
  color: z.string(),
});

interface RoleDisplayProps {
  selectedRole: Role;
  handleSaveChanges: (role: Role) => Promise<void>;
  handleDeleteRole: (role: Role) => Promise<void>;
}

export const RoleDisplay = ({
  selectedRole,
  handleDeleteRole,
  handleSaveChanges,
}: RoleDisplayProps) => {
  const [roleColor, setRoleColor] = useState<string>(selectedRole.color || "Silver");
  const [roleName, setRoleName] = useState<string>(selectedRole.role);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ role: string }>({ role: "" });

  useEffect(() => {
    setRoleColor(selectedRole.color || "Silver");
    setRoleName(selectedRole.role);
    setHasChanges(false);
    setErrors({ role: "" }); // Clear errors when a new role is selected
  }, [selectedRole]);

  const handleColorChange = (color: ColorResult) => {
    setRoleColor(color.hex);
    setHasChanges(true);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (value.length <= 20) {
      setRoleName(value);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      RoleSchema.parse({
        role: roleName,
        color: roleColor,
      });
      const updatedRole = { ...selectedRole, role: roleName, color: roleColor };
      await handleSaveChanges(updatedRole); // Ensure await for async function
      setHasChanges(false);
      setErrors({ role: "" });
    } catch (e: any) {
      const formattedErrors = e.errors.reduce((acc: any, curr: any) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {});
      setErrors(formattedErrors);
    }
  };

  return (
    <div className="p-4">
      <div className="mt-4">
        <label htmlFor="roleName" className="block text-sm font-medium text-light">
          ROLE NAME
        </label>
        <input
          type="text"
          placeholder="Role Name"
          value={roleName}
          onChange={handleNameChange}
          className="mt-2 w-64 flex-grow rounded-md border-b border-raisinblack bg-charleston text-sm text-light placeholder-opacity-50 placeholder:text-light"
          disabled={!selectedRole.editable}
        />
        {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role}</p>}
      </div>

      <hr className="my-8 border-[#525252]" />

      <div className="mt-4">
        <label htmlFor="roleColor" className="mb-6 block text-sm font-medium text-light">
          ROLE COLOR
        </label>
        <CirclePicker color={roleColor} onChangeComplete={handleColorChange} />
      </div>

      <hr className="my-8 border-[#525252]" />
      <div className="flex items-center gap-2">
        {hasChanges && (
          <button
            className=" rounded-md bg-blue-600 px-4 py-2 text-sm"
            onClick={handleSave}
          >
            Save Changes
          </button>
        )}
        {selectedRole?.deletable && (
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm"
            onClick={() => handleDeleteRole(selectedRole)}
          >
            Remove Role
          </button>
        )}
      </div>
    </div>
  );
};

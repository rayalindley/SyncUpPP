import { useState } from "react";
import { CirclePicker } from "react-color";

export const RoleOverview = ({ selectedRole }) => {
  const [roleColor, setRoleColor] = useState("#000000"); // Default color

  const handleColorChange = (color) => {
    setRoleColor(color.hex);
    // Additional logic to handle color change
  };

  return (
    <div className="p-4">
      <div className="mt-4 border-b border-[#525252] pb-6">
        <label htmlFor="roleName" className="block text-sm font-medium text-light">
          ROLE NAME
        </label>
        <input
          type="text"
          placeholder="Role Name"
          className="mt-2 w-64 flex-grow rounded-sm border-b border-raisinblack bg-charleston text-sm text-light placeholder-opacity-50 placeholder:text-light"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="roleColor" className="mb-6 block text-sm font-medium text-light">
          ROLE COLOR
        </label>
        <CirclePicker color={roleColor} onChangeComplete={handleColorChange} />
      </div>
    </div>
  );
};

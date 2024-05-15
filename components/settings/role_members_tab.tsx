import { UserIcon, XCircleIcon } from "@heroicons/react/20/solid";

// Dummy data for members
const membersData = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Robert Johnson" },
  { id: 4, name: "Aliza May" },
  { id: 6, name: "James Alein" },
  // ... more members
];

export const Members = ({ selectedRole }) => {
  const handleRemoveMember = (memberId) => {
    // Logic to remove member will go here
    console.log(`Remove member with ID: ${memberId}`);
  };

  return (
    <div className="p-2">
      <div className="my-4 flex gap-4">
        <input
          type="text"
          placeholder="Search members..."
          className="flex-grow rounded-md border border-raisinblack bg-charleston p-2 text-light placeholder-opacity-50 placeholder:text-light"
        />
        <button
          onClick={() => console.log("Add new member")}
          className="rounded-md bg-primary p-2 px-4 text-sm hover:bg-primarydark"
        >
          Add Member
        </button>
      </div>
      <ul className="mt-2">
        {membersData.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-sm px-2 py-2 hover:bg-charleston"
          >
            <div className="flex items-center">
              <UserIcon className="mr-3 h-5 w-5 text-light" />
              <span className="text-sm text-light">{member.name}</span>
            </div>
            <button
              onClick={() => handleRemoveMember(member.id)}
              className="rounded-full p-1 hover:bg-red-200"
            >
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

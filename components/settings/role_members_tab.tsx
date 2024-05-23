"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { UserIcon, XCircleIcon } from "@heroicons/react/20/solid";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Member, Role } from "@/types/roles";

const MySwal = withReactContent(Swal);

const supabase = createClient();

type MembersProps = {
  selectedRole: Role;
  organizationId: string;
};

export const Members = ({ selectedRole, organizationId }: MembersProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(
    selectedRole.members || []
  );

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredMembers(selectedRole.members || []);
    } else {
      if (selectedRole.members) {
        setFilteredMembers(
          selectedRole.members.filter((member: Member) =>
            `${member.first_name} ${member.last_name}`
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
        );
      }
    }
  }, [searchQuery, selectedRole.members]);

  const handleRemoveMember = async (memberId: string) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Removing the user will set the permissions to default.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "No, keep it",
    });

    if (result.isConfirmed) {
      const { data, error } = await supabase
        .from("organizationmembers")
        .update({ roleid: null })
        .eq("organizationid", organizationId)
        .eq("userid", memberId);

      if (error) {
        MySwal.fire("Error", "Failed to remove member", "error");
        console.error("Error removing member:", error);
      } else {
        MySwal.fire("Removed!", "Member has been removed.", "success");
        // Update the state to remove the member from the list
        setFilteredMembers(
          filteredMembers.filter((member) => member.userid !== memberId)
        );
      }
    }
  };

  const handleAddMember = () => {
    console.log("Add Member");
  };

  return (
    <div className="p-2">
      <div className="my-4 flex gap-4">
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="flex-grow rounded-md border border-raisinblack bg-charleston p-2 px-4 text-sm text-light placeholder-opacity-50 placeholder:text-light "
        />
        <button
          onClick={() => handleAddMember()}
          className="rounded-md bg-primary p-2 px-4 text-sm hover:bg-primarydark"
        >
          Add Member
        </button>
      </div>
      <ul className="mt-2">
        {!filteredMembers.length && <p className="mt-10">No members found.</p>}

        {filteredMembers.map((member: Member) => (
          <li
            key={member.userid}
            className="flex items-center justify-between rounded-sm px-2 py-2 hover:bg-charleston"
          >
            <Link href={`/user/profile/${member.userid}`} target="_blank">
              <div className="flex items-center">
                <div className="mr-2 h-10 w-10 rounded-full bg-gray-500">
                  {member.profilepicture ? (
                    <img
                      className="object-fit h-full w-full rounded-full"
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${member.profilepicture}`}
                    />
                  ) : (
                    <UserIcon className="text-zinc-200" />
                  )}
                </div>
                <span className="text-sm text-light">
                  {member.first_name} {member.last_name}
                </span>
              </div>
            </Link>
            <button
              onClick={() => handleRemoveMember(member.userid)}
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

"use client";
import { Fragment, useState, useEffect, ChangeEvent } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  UserIcon,
  XCircleIcon,
  CheckIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Member } from "@/types/member";
import { Role } from "@/types/role";

const MySwal = withReactContent(Swal);

const supabase = createClient();

type MembersProps = {
  selectedRole: Role;
  organizationid: string;
  onRoleMembersUpdate: (updatedMembers: Member[], roleId: string) => void;
  onMoveMember: (memberId: string, newRoleId: string) => void;
};

export const Members = ({
  selectedRole,
  organizationid,
  onRoleMembersUpdate,
  onMoveMember,
}: MembersProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(
    selectedRole.members || []
  );
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [filteredModalMembers, setFilteredModalMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredMembers(selectedRole.members || []);
    } else {
      setFilteredMembers(
        (selectedRole.members || []).filter((member: Member) =>
          `${member.first_name} ${member.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, selectedRole.members]);

  useEffect(() => {
    const fetchAllMembers = async () => {
      const { data, error } = await supabase
        .from("organizationmembers")
        .select("userid")
        .eq("organizationid", organizationid);

      if (data) {
        const userIds = data.map((item: { userid: string }) => item.userid);
        const { data: userProfiles, error: profileError } = await supabase
          .from("userprofiles")
          .select("*")
          .in("userid", userIds);

        if (userProfiles) {
          setAllMembers(userProfiles);
          const roleMemberIds = (selectedRole.members || []).map(
            (member) => member.userid
          );
          setFilteredModalMembers(
            userProfiles.filter((member) => !roleMemberIds.includes(member.userid))
          );
        } else {
          console.error(profileError);
        }
      } else {
        console.error(error);
      }
    };

    if (modalIsOpen) {
      fetchAllMembers();
    }
  }, [modalIsOpen, organizationid, selectedRole.members]);

  useEffect(() => {
    const roleMemberIds = (selectedRole.members || []).map((member) => member.userid);
    const filtered = allMembers.filter(
      (member) => !roleMemberIds.includes(member.userid)
    );
    if (searchQuery === "") {
      setFilteredModalMembers(filtered);
    } else {
      setFilteredModalMembers(
        filtered.filter((member) =>
          `${member.first_name} ${member.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, allMembers, selectedRole.members]);

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
      const { error } = await supabase
        .from("organizationmembers")
        .update({ roleid: null })
        .eq("organizationid", organizationid)
        .eq("userid", memberId);

      if (error) {
        MySwal.fire("Error", "Failed to remove member", "error");
        console.error("Error removing member:", error);
      } else {
        MySwal.fire("Removed!", "Member has been removed.", "success");
        const updatedMembers = filteredMembers.filter(
          (member) => member.userid !== memberId
        );
        setFilteredMembers(updatedMembers);
        onRoleMembersUpdate(updatedMembers, selectedRole.role_id);
      }
    }
  };

  const handleAddMembers = async () => {
    setModalIsOpen(false);
    const membersToAdd = Array.from(selectedMembers);
    for (const memberId of membersToAdd) {
      await onMoveMember(memberId, selectedRole.role_id);
    }

    const updatedRoleMembers = await fetchRoleMembers();
    setFilteredMembers(updatedRoleMembers);
    setSelectedMembers(new Set());
  };

  const fetchRoleMembers = async () => {
    const { data, error } = await supabase
      .from("organizationmembers")
      .select("userid, roleid")
      .eq("organizationid", organizationid);

    if (data) {
      const roleMemberIds = data
        .filter((item: { roleid: string }) => item.roleid === selectedRole.role_id)
        .map((item: { userid: string }) => item.userid);
      const { data: userProfiles, error: profileError } = await supabase
        .from("userprofiles")
        .select("*")
        .in("userid", roleMemberIds);

      if (userProfiles) {
        return userProfiles;
      } else {
        console.error(profileError);
        return [];
      }
    } else {
      console.error(error);
      return [];
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prevSelectedMembers) => {
      const updatedSelection = new Set(prevSelectedMembers);
      if (updatedSelection.has(memberId)) {
        updatedSelection.delete(memberId);
      } else {
        updatedSelection.add(memberId);
      }
      return updatedSelection;
    });
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
          onClick={() => setModalIsOpen(true)}
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

      <Transition show={modalIsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-[#232323] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="mb-4 text-center text-base font-semibold leading-6 text-light "
                      >
                        Add Members
                        <br />
                        <span
                          className="mr-2 inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: selectedRole.color }}
                        />
                        <span className="text-sm">{selectedRole.role}</span>
                      </Dialog.Title>
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Search all members..."
                          className="w-full rounded-md border border-raisinblack bg-charleston p-2 px-4 text-sm text-light placeholder-opacity-50 placeholder:text-light "
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setSearchQuery(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <ul className="mt-2 max-h-60 overflow-y-auto">
                      {!filteredModalMembers.length && (
                        <p className="mt-10">No members found.</p>
                      )}

                      {filteredModalMembers.map((member: Member) => (
                        <li
                          key={member.userid}
                          className="flex cursor-pointer items-center justify-between rounded-md px-4 py-2 hover:bg-charleston"
                          onClick={() => toggleMemberSelection(member.userid)}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-4 rounded-sm bg-zinc-200 checked:bg-primary"
                              checked={selectedMembers.has(member.userid)}
                              onChange={(e) => {
                                e.stopPropagation(); // Prevent the click event from propagating to the li
                                toggleMemberSelection(member.userid);
                              }}
                            />
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
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:flex sm:justify-end sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-transparent px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm hover:text-gray-400  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 sm:w-auto"
                      onClick={() => setModalIsOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="hover:primarydark inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2  sm:w-auto"
                      onClick={handleAddMembers}
                    >
                      Add
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

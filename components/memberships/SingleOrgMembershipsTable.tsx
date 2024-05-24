// "use client";
// import { useState } from "react";
// import { Listbox } from "@headlessui/react";
// import MembershipOptions from "./membership_options";
// import MembershipModal from "./create_membership_modal";

// export default function SingleMembershipsTable({ orgmems, allMembers }) {
//   const [selectedOrgId, setSelectedOrgId] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   console.log("orgmems", orgmems);
//   console.log("allMembers", allMembers);

//   // Extract unique organizations
//   const organizations = Array.from(new Set(orgmems.map((mem) => mem.organizationid))).map(
//     (id) => {
//       const found = orgmems.find((mem) => mem.organizationid === id);
//       return { id: found?.organizationid, name: found?.orgname };
//     }
//   );

//   const openModal = (orgId) => {
//     setSelectedOrgId(orgId);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setSelectedOrgId("");
//   };

//   return (
//     <div className="px-4 sm:px-6 lg:px-8">
//       <div className="sm:flex sm:items-center">
//         <div className="sm:flex-auto">
//           <h1 className="text-base font-semibold leading-6 text-light">Memberships</h1>
//           <p className="mt-2 text-sm text-light">
//             A list of all the memberships in your organization
//           </p>
//         </div>
//       </div>
//       <div className="mt-8 flow-root">
//         <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
//           <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
//             <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
//               <table className="min-w-full divide-y divide-[#525252]">
//                 <thead className="bg-charleston">
//                   <tr>
//                     <th
//                       scope="col"
//                       className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light sm:pl-6"
//                     >
//                       Organization
//                     </th>
//                     <th
//                       scope="col"
//                       className="px-3 py-3.5 text-left text-sm font-semibold text-light"
//                     >
//                       Membership
//                     </th>
//                     <th
//                       scope="col"
//                       className="px-3 py-3.5 text-left text-sm font-semibold text-light"
//                     >
//                       Fee
//                     </th>
//                     <th
//                       scope="col"
//                       className="px-3 py-3.5 text-left text-sm font-semibold text-light"
//                     >
//                       Members
//                     </th>
//                     <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
//                       <span className="sr-only">Edit</span>
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-[#525252] bg-raisinblack">
//                   {orgmems.map((mem, index) => (
//                     <MemRow
//                       key={index}
//                       mem={mem}
//                       members={allMembers.filter(
//                         (member) => member.organizationid === mem.organizationid
//                       )}
//                       showOrg={true}
//                       openModal={openModal}
//                     />
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//       <MembershipModal
//         isOpen={isModalOpen}
//         onClose={closeModal}
//         organizationid={selectedOrgId}
//         membership={null} // Pass existing membership object if editing
//       />
//     </div>
//   );
// }

// function MemRow({ mem, members, showOrg, openModal }) {
//   const [open, setOpen] = useState(false);

//   return (
//     <tr>
//       {showOrg && (
//         <td
//           className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-light sm:pl-6"
//           onClick={() => setOpen(!open)}
//         >
//           <a
//             href="#"
//             className="hover:text-primary"
//             onClick={(e) => {
//               e.stopPropagation();
//               setOpen(!open);
//             }}
//           >
//             {mem.orgname}
//           </a>
//         </td>
//       )}
//       <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
//         {mem.membershipname}
//       </td>
//       <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
//         $ {mem.registrationfee.toFixed(2)}
//       </td>
//       <td className="whitespace-nowrap px-3 py-4 text-sm text-light">{members.length}</td>
//       <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
//         <MembershipOptions
//           selectedTier={mem}
//           open={open}
//           setOpen={setOpen}
//           TierMembers={members}
//         />
//         <button
//           className="text-primary hover:text-primarydark"
//           onClick={() => openModal(mem.organizationid)}
//         >
//           Edit
//         </button>
//       </td>
//     </tr>
//   );
// }

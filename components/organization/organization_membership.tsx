import MembershipTiers from "./membership_tiers";
import { Membership, MembershipsProps } from "@/lib/types";

const OrganizationMembershipsComponent: React.FC<MembershipsProps> = ({ memberships }) => {

  return (
    <div>
      <MembershipTiers memberships = {memberships} />
    </div>
  );
};

export default OrganizationMembershipsComponent;

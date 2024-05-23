import MembershipTiers from "./membership_tiers";
import { Membership, MembershipsProps } from "@/lib/types";

const OrganizationMembershipsComponent: React.FC<MembershipsProps> = ({
  memberships,
  userid,
}) => {
  return (
    <div>
      <MembershipTiers memberships={memberships} userid={userid} />
    </div>
  );
};

export default OrganizationMembershipsComponent;

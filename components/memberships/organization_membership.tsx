import MembershipTiers from "./membership_tiers";
import { MembershipsProps } from "@/types/memberships_props";

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

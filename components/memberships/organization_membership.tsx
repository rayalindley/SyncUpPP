import MembershipTiers from "./membership_tiers";
import { MembershipsProps } from "@/types/memberships_props";

const OrganizationMembershipsComponent: React.FC<MembershipsProps> = ({
  memberships,
  userid,
  organizationid,
}) => {
  return (
    <div>
        <MembershipTiers memberships={memberships} userid={userid} organizationid={organizationid} />
    </div>
  );
};

export default OrganizationMembershipsComponent;

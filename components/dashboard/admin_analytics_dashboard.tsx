"use client";
import Loader from "@/components/Loader";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  FaBuilding,
  FaCalendarAlt,
  FaClipboardList,
  FaMoneyBillWave,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgHealth {
  name: string;
  organizationid: string;
  slug: string;
  total_members: number;
  total_events: number;
  total_registrations: number;
  last_active: string | null;
}

interface TopOrg {
  name: string;
  total_events: number;
  total_posts: number;
  total_members: number;
  total_registrations?: number;
}

interface EventRegOverTime {
  registration_date: string;
  total_registrations: number;
}

interface RevenueByOrg {
  name: string;
  total_revenue: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
}> = ({ title, value, icon, sub }) => (
  <div className="flex items-center rounded-xl bg-charleston p-6 shadow-md border border-[#2a2a2a] hover:border-primary/40 transition-colors">
    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl text-primary flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#525252] bg-[#1a1a1a] px-4 py-3 shadow-xl text-sm">
        <p className="mb-1 font-semibold text-gray-300">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: <span className="text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BAR_COLORS = ["#37996b", "#2dd4bf", "#34d399", "#6366f1", "#a78bfa"];

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex h-56 items-center justify-center text-sm text-gray-500">
    {text}
  </div>
);

function lastActiveBadge(lastActive: string | null) {
  if (!lastActive) return <span className="text-xs text-gray-500">No activity</span>;
  const days = Math.floor(
    (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 7) return <span className="text-xs text-emerald-400">Active this week</span>;
  if (days <= 30) return <span className="text-xs text-yellow-400">Active this month</span>;
  return <span className="text-xs text-red-400">{days}d ago</span>;
}

// ─── Main Component ─────────────────────────────────────��─────────────────────

const AdminAnalyticsDashboard = ({ user }: { user: User | null }) => {
  const supabase = createClient();
  const userId = user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [topOrgs, setTopOrgs] = useState<TopOrg[]>([]);
  const [topOrgFilter, setTopOrgFilter] = useState("total_registrations");
  const [eventRegsOverTime, setEventRegsOverTime] = useState<EventRegOverTime[]>([]);
  const [revenueByOrg, setRevenueByOrg] = useState<RevenueByOrg[]>([]);
  const [orgHealth, setOrgHealth] = useState<OrgHealth[]>([]);

  const topOrgFilterLabels: Record<string, string> = {
    total_registrations: "Event Registrations",
    total_events: "Total Events",
    total_members: "Total Members",
    total_posts: "Total Posts",
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const isSuperAdmin = user.role === "superadmin";

        // ── Step 1: Get orgs this user administers ─────────────────────────
        let orgsForHealth: { organizationid: string; name: string; slug: string }[] = [];

        if (isSuperAdmin) {
          const { data: allOrgs } = await supabase
            .from("organizations")
            .select("organizationid, name, slug");
          orgsForHealth = (allOrgs ?? []) as any;
        } else {
          // Owned orgs (adminid column on organizations table)
          const { data: ownedOrgs } = await supabase
            .from("organizations")
            .select("organizationid, name, slug")
            .eq("adminid", userId);

          // Also orgs where user has admin/owner role in organization_members_roles
          const { data: memberRows } = await supabase
            .from("organization_members_roles")
            .select("organizationid")
            .eq("userid", userId)
            .in("role", ["admin", "owner"]);

          const fromMember = (memberRows ?? []).map((r: any) => r.organizationid);
          const fromOwned = (ownedOrgs ?? []).map((o: any) => o.organizationid);
          const allOrgIds = Array.from(new Set([...fromOwned, ...fromMember]));

          if (allOrgIds.length > 0) {
            const { data: fullOrgs } = await supabase
              .from("organizations")
              .select("organizationid, name, slug")
              .in("organizationid", allOrgIds);
            orgsForHealth = (fullOrgs ?? []) as any;
          }
        }

        const orgIds = orgsForHealth.map((o) => o.organizationid);
        setTotalOrgs(orgIds.length);

        if (orgIds.length === 0) {
          setIsLoading(false);
          return;
        }

        // ── Step 2: Fetch all events for these orgs ────────────────────────
        const { data: eventRows } = await supabase
          .from("events")
          .select("id, organizationid")
          .in("organizationid", orgIds)
          .or("is_deleted.eq.false,is_deleted.is.null");

        const eventIds = (eventRows ?? []).map((e: any) => e.id);
        setTotalEvents(eventIds.length);

        // ── Step 3: All registrations for those events ─────────────────────
        let allRegs: { eventid: string; registrationdate: string }[] = [];
        if (eventIds.length > 0) {
          const { data: regRows } = await supabase
            .from("eventregistrations")
            .select("eventid, registrationdate")
            .in("eventid", eventIds);
          allRegs = (regRows ?? []) as any;
          setTotalRegistrations(allRegs.length);
        }

        // ── Step 4: Revenue ────────────────────────────────────────────────
        const { data: payments } = await supabase
          .from("payments")
          .select("amount, organizationId")
          .in("organizationId", orgIds)
          .eq("status", "paid");

        const rev = (payments ?? []).reduce(
          (sum: number, p: any) => sum + (p.amount ?? 0),
          0
        );
        setTotalRevenue(rev);

        const revMap: Record<string, number> = {};
        for (const p of payments ?? []) {
          revMap[p.organizationId] = (revMap[p.organizationId] ?? 0) + (p.amount ?? 0);
        }
        if (Object.keys(revMap).length > 0) {
          setRevenueByOrg(
            orgsForHealth
              .filter((o) => revMap[o.organizationid])
              .map((o) => ({
                name: o.name,
                total_revenue: Math.round((revMap[o.organizationid] ?? 0) / 100),
              }))
          );
        }

        // ── Step 5: Event registrations over time ──────────────────────────
        const dateMap: Record<string, number> = {};
        for (const row of allRegs) {
          if (!row.registrationdate) continue;
          const date = row.registrationdate.split("T")[0];
          dateMap[date] = (dateMap[date] ?? 0) + 1;
        }
        setEventRegsOverTime(
          Object.entries(dateMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([registration_date, total_registrations]) => ({
              registration_date,
              total_registrations,
            }))
        );

        // ── Step 6: Build org health directly from source tables ───────────

        // ✅ FIXED: use organization_members_roles (the actual table the app uses)
        const { data: memberCounts } = await supabase
          .from("organization_members_roles")
          .select("organizationid")
          .in("organizationid", orgIds);

        const memberCountMap: Record<string, number> = {};
        for (const m of memberCounts ?? []) {
          memberCountMap[m.organizationid] = (memberCountMap[m.organizationid] ?? 0) + 1;
        }

        // Total members across all orgs
        const totalMembersCount = Object.values(memberCountMap).reduce((a, b) => a + b, 0);

        // Count events per org (already have eventRows)
        const eventCountMap: Record<string, number> = {};
        for (const e of eventRows ?? []) {
          eventCountMap[e.organizationid] = (eventCountMap[e.organizationid] ?? 0) + 1;
        }

        // Count registrations per org — build a lookup map first for O(1) access
        const eventToOrgMap: Record<string, string> = {};
        for (const e of eventRows ?? []) {
          eventToOrgMap[e.id] = e.organizationid;
        }
        const regCountMap: Record<string, number> = {};
        for (const r of allRegs) {
          const orgId = eventToOrgMap[r.eventid];
          if (orgId) regCountMap[orgId] = (regCountMap[orgId] ?? 0) + 1;
        }

        // Last activity per org
        const { data: activities } = await supabase
          .from("activities")
          .select("organization_id, created_at")
          .in("organization_id", orgIds)
          .order("created_at", { ascending: false });

        const lastActiveMap: Record<string, string> = {};
        for (const act of activities ?? []) {
          if (!lastActiveMap[act.organization_id]) {
            lastActiveMap[act.organization_id] = act.created_at;
          }
        }

        const health: OrgHealth[] = orgsForHealth.map((org) => ({
          name: org.name,
          organizationid: org.organizationid,
          slug: org.slug,
          total_members: memberCountMap[org.organizationid] ?? 0,
          total_events: eventCountMap[org.organizationid] ?? 0,
          total_registrations: regCountMap[org.organizationid] ?? 0,
          last_active: lastActiveMap[org.organizationid] ?? null,
        }));

        setOrgHealth(health);

        // ── Step 7: Top orgs chart — built from direct data ────────────────
        // Fetch post counts per org
        const { data: postRows } = await supabase
          .from("posts")
          .select("organizationid")
          .in("organizationid", orgIds);

        const postCountMap: Record<string, number> = {};
        for (const p of postRows ?? []) {
          postCountMap[p.organizationid] = (postCountMap[p.organizationid] ?? 0) + 1;
        }

        const topOrgsBuilt: TopOrg[] = orgsForHealth.map((org) => ({
          name: org.name,
          total_members: memberCountMap[org.organizationid] ?? 0,
          total_events: eventCountMap[org.organizationid] ?? 0,
          total_registrations: regCountMap[org.organizationid] ?? 0,
          total_posts: postCountMap[org.organizationid] ?? 0,
        }));

        topOrgsBuilt.sort(
          (a, b) => ((b as any)[topOrgFilter] ?? 0) - ((a as any)[topOrgFilter] ?? 0)
        );
        setTopOrgs(topOrgsBuilt.slice(0, 5));

      } catch (err) {
        console.error("AdminAnalyticsDashboard error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, topOrgFilter]);

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="adminBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#37996b" stopOpacity={1} />
            <stop offset="100%" stopColor="#1f5c3e" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="adminLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#37996b" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
          <linearGradient id="adminRevGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Organizations"
          value={totalOrgs}
          icon={<FaBuilding />}
          sub="All orgs you manage"
        />
        <SummaryCard
          title="Total Active Events"
          value={totalEvents}
          icon={<FaCalendarAlt />}
          sub="Non-deleted events"
        />
        <SummaryCard
          title="Total Event Registrations"
          value={totalRegistrations}
          icon={<FaClipboardList />}
          sub="Across all your events"
        />
        <SummaryCard
          title="Total Revenue"
          value={`₱${totalRevenue.toLocaleString()}`}
          icon={<FaMoneyBillWave />}
          sub="Paid transactions only"
        />
      </div>

      {/* Row 1: Top Orgs + Event Regs Over Time */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-charleston border border-[#2a2a2a] p-5 shadow-md">
          <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">Top Performing Organizations</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by selected metric</p>
            </div>
            <select
              value={topOrgFilter}
              onChange={(e) => setTopOrgFilter(e.target.value)}
              className="rounded-md border border-[#525252] bg-[#1a1a1a] px-3 py-1.5 text-xs text-light focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="total_registrations">Event Registrations</option>
              <option value="total_events">Total Events</option>
              <option value="total_members">Total Members</option>
              <option value="total_posts">Total Posts</option>
            </select>
          </div>
          {topOrgs.length === 0 ? (
            <EmptyState text="No organization data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topOrgs} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(55,153,107,0.08)" }} />
                <Bar dataKey={topOrgFilter} name={topOrgFilterLabels[topOrgFilter]} fill="url(#adminBarGradient)" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {topOrgs.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl bg-charleston border border-[#2a2a2a] p-5 shadow-md">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Event Registrations Over Time</h2>
            <p className="text-xs text-gray-400 mt-0.5">Daily registrations across all your events</p>
          </div>
          {eventRegsOverTime.length === 0 ? (
            <EmptyState text="No registration data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={eventRegsOverTime} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="registration_date" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#37996b", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af", paddingTop: "12px" }} />
                <Line type="monotone" dataKey="total_registrations" name="Registrations" stroke="url(#adminLineGradient)" strokeWidth={2.5} dot={{ r: 4, fill: "#37996b", strokeWidth: 0 }} activeDot={{ r: 7, fill: "#37996b", stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Revenue by Org (only shown if there's revenue) */}
      {revenueByOrg.length > 0 && (
        <div className="rounded-xl bg-charleston border border-[#2a2a2a] p-5 shadow-md">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Revenue by Organization</h2>
            <p className="text-xs text-gray-400 mt-0.5">Paid transactions only (₱)</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByOrg} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v) => `₱${v.toLocaleString()}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="total_revenue" name="Revenue (₱)" fill="url(#adminRevGradient)" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {revenueByOrg.map((_, i) => (
                  <Cell key={i} fill={["#6366f1", "#a78bfa", "#818cf8"][i % 3]} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Row 3: Org Health Table */}
      <div className="rounded-xl bg-charleston border border-[#2a2a2a] p-5 shadow-md">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-white">Organizations Health Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">Spot active, growing, or inactive organizations at a glance</p>
        </div>
        {orgHealth.length === 0 ? (
          <EmptyState text="No organizations found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-medium">Organization</th>
                  <th className="pb-3 pr-4 font-medium text-center">Members</th>
                  <th className="pb-3 pr-4 font-medium text-center">Events</th>
                  <th className="pb-3 pr-4 font-medium text-center">Registrations</th>
                  <th className="pb-3 font-medium text-center">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {orgHealth.map((org) => (
                  <tr key={org.organizationid} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 pr-4">
                      <a
                        href={`/${org.slug}/dashboard`}
                        className="font-medium text-white hover:text-primary transition-colors"
                      >
                        {org.name}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-300">{org.total_members}</td>
                    <td className="py-3 pr-4 text-center text-gray-300">{org.total_events}</td>
                    <td className="py-3 pr-4 text-center text-gray-300">{org.total_registrations}</td>
                    <td className="py-3 text-center">{lastActiveBadge(org.last_active)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
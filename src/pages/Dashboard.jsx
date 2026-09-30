import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PiUsers, PiGavel, PiScales, PiSteeringWheel, PiArrowRight, PiUserPlus } from "react-icons/pi";
import useAsync from "../hooks/useAsync";
import { adminGetBailBonds, adminGetDrivers, adminGetLawyers, adminGetUsers } from "../api/api";
import { getAdminProfile } from "../api/authHelper";
import { getDisplayName } from "../utils/userUtils";
import { formatDate, formatNaira, humanize, toTimestamp } from "../utils/format";
import { bailBondStatus, statusTone } from "../utils/status";
import { bailBondCharges } from "../utils/bailBondCharges";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { Card, CardHeader } from "../components/ui/Card";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import { EmptyState, Skeleton } from "../components/ui/States";

// Each list loads independently so one failing endpoint doesn't blank the others
const loadAll = async () => {
  const [users, lawyers, bonds, drivers] = await Promise.allSettled([adminGetUsers(), adminGetLawyers(), adminGetBailBonds(), adminGetDrivers()]);
  const list = (result, pick = (v) => v) => (result.status === "fulfilled" && Array.isArray(pick(result.value)) ? pick(result.value) : null);
  return { users: list(users), lawyers: list(lawyers, (v) => v?.data), bonds: list(bonds), drivers: list(drivers) };
};

/** Signups per month for the last six months, oldest first */
const signupsByMonth = (users) => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-GB", { month: "short" }), signups: 0 };
  });
  users.forEach((user) => {
    const ts = toTimestamp(user?.time);
    if (!ts) return;
    const d = new Date(ts);
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.signups += 1;
  });
  return months;
};

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-stone-900 px-3 py-2 text-xs text-white shadow-pop">
      <p className="text-stone-300">{label}</p>
      <p className="tabular mt-0.5 font-semibold">
        {payload[0].value} new {payload[0].value === 1 ? "user" : "users"}
      </p>
    </div>
  );
}

const statusColor = { Approved: "#10b981", Pending: "#f59e0b", Rejected: "#e11d48", Withdrawn: "#a8a29e" };

function BondStatusBreakdown({ bonds }) {
  const counts = ["Pending", "Approved", "Rejected", "Withdrawn"].map((status) => ({
    status,
    count: bonds.filter((bond) => bailBondStatus(bond) === status).length,
  }));
  const total = bonds.length;

  if (!total) return <EmptyState icon={PiScales} title="No bail bond requests yet" description="New requests will show up here." className="py-10" />;

  return (
    <div className="space-y-5 p-5">
      <div>
        <p className="tabular text-3xl font-semibold tracking-tight text-stone-900">{total}</p>
        <p className="text-sm text-stone-500">requests in total</p>
      </div>
      {/* Proportion bar: 2px surface gaps between segments */}
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={counts.map((c) => `${c.status}: ${c.count}`).join(", ")}>
        {counts
          .filter((c) => c.count)
          .map((c) => (
            <div key={c.status} style={{ width: `${(c.count / total) * 100}%`, background: statusColor[c.status] }} title={`${c.status}: ${c.count}`} />
          ))}
      </div>
      <ul className="space-y-2.5">
        {counts.map((c) => (
          <li key={c.status} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-stone-600">
              <span className="size-2.5 rounded-sm" style={{ background: statusColor[c.status] }} />
              {c.status}
            </span>
            <span className="tabular text-stone-900">
              <span className="font-medium">{c.count}</span>
              <span className="ml-2 text-stone-400">{Math.round((c.count / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Dashboard = () => {
  const { data, loading } = useAsync(loadAll);
  const admin = getAdminProfile();
  const users = data?.users || [];
  const bonds = data?.bonds || [];

  const recentUsers = [...users].sort((a, b) => toTimestamp(b.time) - toTimestamp(a.time)).slice(0, 5);
  const recentBonds = [...bonds].sort((a, b) => toTimestamp(b.time) - toTimestamp(a.time)).slice(0, 5);
  const monthly = signupsByMonth(users);
  const thisMonth = monthly[monthly.length - 1]?.signups ?? 0;
  const failed = data && ["users", "lawyers", "bonds", "drivers"].filter((key) => data[key] === null);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${admin.name.split(" ")[0]}`}
        description={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      />

      {failed?.length > 0 && (
        <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200 ring-inset">
          Some figures couldn't be loaded ({failed.join(", ")}). The numbers below may be incomplete.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard featured label="Users" value={users.length} icon={PiUsers} to="/admin/users" loading={loading} hint={`${thisMonth} joined this month`} />
        <StatCard label="Lawyers" value={data?.lawyers?.length ?? 0} icon={PiGavel} to="/admin/lawyers" loading={loading} hint="Registered profiles" />
        <StatCard
          label="Bail bonds"
          value={bonds.length}
          icon={PiScales}
          to="/admin/bailbond"
          loading={loading}
          hint={`${bonds.filter((b) => bailBondStatus(b) === "Pending").length} awaiting review`}
        />
        <StatCard
          label="Drivers"
          value={data?.drivers?.length ?? 0}
          icon={PiSteeringWheel}
          to="/admin/drivers"
          loading={loading}
          hint={`${(data?.drivers || []).filter((d) => d.status && !d.offline).length} available now`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="New users" description="Sign-ups per month, last six months" />
          <div className="h-64 px-2 pt-4 pb-2">
            {loading ? (
              <Skeleton className="mx-4 h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                  <CartesianGrid vertical={false} stroke="#f0eeec" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#78716c", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#a8a29e", fontSize: 12 }} width={40} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgb(64 9 69 / 0.05)", radius: 6 }} />
                  <Bar dataKey="signups" fill="#7f3a84" radius={[4, 4, 0, 0]} maxBarSize={36} activeBar={{ fill: "#400945" }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Bail bond status"
            actions={
              <Link to="/admin/bailbond" className="text-sm font-medium text-brand-700 hover:text-brand-900">
                View all
              </Link>
            }
          />
          {loading ? (
            <div className="space-y-4 p-5">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <BondStatusBreakdown bonds={bonds} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Latest users"
            actions={
              <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900">
                All users <PiArrowRight className="size-3.5" />
              </Link>
            }
          />
          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : recentUsers.length ? (
            <ul className="divide-y divide-stone-100">
              {recentUsers.map((user) => (
                <li key={user.id}>
                  <Link to={`/admin/user/${user.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-stone-50">
                    <Avatar name={getDisplayName(user)} src={user.photoUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{getDisplayName(user)}</p>
                      <p className="truncate text-xs text-stone-500">{user.email}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <Badge tone="brand">{humanize(user.userType)}</Badge>
                      <p className="mt-1 text-xs text-stone-400">{formatDate(user.time)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={PiUserPlus} title="No users yet" description="People who sign up in the app will appear here." className="py-10" />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Latest bail bond requests"
            actions={
              <Link to="/admin/bailbond" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900">
                All requests <PiArrowRight className="size-3.5" />
              </Link>
            }
          />
          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : recentBonds.length ? (
            <ul className="divide-y divide-stone-100">
              {recentBonds.map((bond) => {
                const status = bailBondStatus(bond);
                return (
                  <li key={bond.id}>
                    <Link to={`/admin/bailbond/${encodeURIComponent(bond.id)}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-stone-50">
                    <Avatar name={bond.fullName || "Unknown"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{bond.fullName || "Unnamed submitter"}</p>
                      <p className="tabular text-xs text-stone-500">Bail {formatNaira(bailBondCharges(bond).bail)} · pays {formatNaira(bailBondCharges(bond).total)}</p>
                    </div>
                    <Badge tone={statusTone[status]} dot>
                      {status}
                    </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={PiScales} title="No requests yet" className="py-10" />
          )}
        </Card>
      </div>
    </>
  );
};

export default Dashboard;

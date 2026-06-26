import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useReportStats } from "@/hooks/use-reports";
import { Users, CreditCard, CalendarCheck, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const { user } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedDivisionId, setSelectedDivisionId] = useState("all");

  const { data: allStats, isLoading } = useReportStats(startDate || undefined, endDate || undefined);

  const { data: classes } = useQuery({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path, { credentials: "include" });
      return api.classes.list.responses[200].parse(await res.json());
    },
  });

  const selectedClass = classes?.find(c => String(c.id) === selectedClassId);
  const divisionsForClass = selectedClass?.divisions || [];

  const filteredStats = useMemo(() => {
    if (!allStats) return [];
    let s = allStats;
    if (selectedClassId !== "all") {
      s = s.filter(m => m.className.toLowerCase() === selectedClass?.name.toLowerCase());
    }
    if (selectedDivisionId !== "all") {
      const div = divisionsForClass.find(d => String(d.id) === selectedDivisionId);
      if (div) s = s.filter(m => m.divisionName.toLowerCase() === div.name.toLowerCase());
    }
    return s;
  }, [allStats, selectedClassId, selectedDivisionId, selectedClass, divisionsForClass]);

  const totalMembers = filteredStats.length;
  const totalOfferings = filteredStats.reduce((sum, s) => sum + s.totalOffering, 0);
  const avgAttendance = filteredStats.length
    ? Math.round(filteredStats.reduce((sum, s) => sum + s.attendancePercentage, 0) / filteredStats.length)
    : 0;

  const hasAttendance = filteredStats.some(s => s.totalDays > 0);

  const chartData = filteredStats
    .filter(s => s.totalDays > 0)
    .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
    .map(s => ({
      name: s.memberName.split(" ")[0],
      fullName: s.memberName,
      "Attendance %": s.attendancePercentage,
      "Offering": Math.round(s.totalOffering),
    }));

  const chartWidth = Math.max(chartData.length * 72, 300);

  const topMembers = filteredStats
    .filter(s => s.totalDays > 0)
    .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
    .slice(0, 6);

  const handleClassChange = (val: string) => {
    setSelectedClassId(val);
    setSelectedDivisionId("all");
  };

  return (
    <Layout>
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-gray-400">
          Welcome back, <span className="font-medium text-slate-700 dark:text-gray-200">{user?.displayName || user?.username}</span>!
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">Filter</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-500 dark:text-gray-400">From Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              data-testid="input-start-date"
              className="h-9 text-sm bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-500 dark:text-gray-400">To Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              data-testid="input-end-date"
              className="h-9 text-sm bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-500 dark:text-gray-400">Class</Label>
            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger data-testid="select-class" className="h-9 text-sm bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700">
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-500 dark:text-gray-400">Section</Label>
            <Select
              value={selectedDivisionId}
              onValueChange={setSelectedDivisionId}
              disabled={selectedClassId === "all"}
            >
              <SelectTrigger data-testid="select-section" className="h-9 text-sm bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 disabled:opacity-50">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700">
                <SelectItem value="all">All Sections</SelectItem>
                {divisionsForClass.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard title="Total Members" value={totalMembers} icon={<Users className="w-6 h-6" />} />
          <StatCard title="Total Offerings" value={formatCurrency(totalOfferings)} icon={<CreditCard className="w-6 h-6" />} />
          <StatCard title="Avg. Attendance" value={`${avgAttendance}%`} icon={<CalendarCheck className="w-6 h-6" />} />
        </div>
      )}

      {!isLoading && totalMembers === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400 dark:text-gray-500" />
          </div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white mb-2">No data yet</h3>
          <p className="text-slate-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
            Start by adding classes and members, then record attendance to see your dashboard come alive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Attendance Chart</h3>
              {chartData.length > 0 && (
                <span className="text-xs text-slate-400 dark:text-gray-500">{chartData.length} member{chartData.length !== 1 ? "s" : ""}</span>
              )}
            </div>
            {!hasAttendance ? (
              <div className="h-[320px] flex flex-col items-center justify-center text-slate-400 dark:text-gray-500">
                <CalendarCheck className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No attendance recorded yet.</p>
                <p className="text-xs mt-1">Go to Attendance to start marking presence.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ width: chartWidth, minWidth: "100%" }}>
                  <BarChart
                    width={chartWidth}
                    height={320}
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(59,130,246,0.05)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 16px -2px rgb(0 0 0 / 0.12)",
                        background: "#fff",
                      }}
                      formatter={(value: any, name: string) =>
                        name === "Attendance %" ? [`${value}%`, name] : [formatCurrency(value), name]
                      }
                    />
                    <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />
                    <Bar dataKey="Offering" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Attendance %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </div>
              </div>
            )}
          </div>

          {/* Top Members */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-5">Top Members</h3>
            <div className="space-y-3">
              {topMembers.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-gray-500 text-center py-4">No attendance data yet.</p>
              ) : (
                topMembers.map((member, i) => {
                  const colors = [
                    "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                    "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                    "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                    "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                    "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
                    "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
                  ];
                  const pct = member.attendancePercentage;
                  const barColor = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-400";
                  return (
                    <div key={member.memberId} className="pb-3 border-b border-slate-50 dark:border-gray-800 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${colors[i % colors.length]}`}>
                          {member.memberName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{member.memberName}</p>
                          <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{member.className} · {member.divisionName}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-gray-200 shrink-0">{pct}%</span>
                      </div>
                      <div className="ml-12 h-1.5 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

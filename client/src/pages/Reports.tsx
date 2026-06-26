import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useReportStats } from "@/hooks/use-reports";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Download, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";

export default function Reports() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: stats, isLoading } = useReportStats(
    format(dateRange.from, "yyyy-MM-dd"),
    format(dateRange.to, "yyyy-MM-dd")
  );

  const handleExportCSV = () => {
    if (!stats) return;
    const headers = ["Member Name", "Type", "Class", "Division", "Total Present", "Total Offering", "Attendance %"];
    const rows = stats.map(s => [s.memberName, s.type, s.className, s.divisionName, s.totalPresent, s.totalOffering, s.attendancePercentage + "%"]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `church_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-slate-500 dark:text-gray-400">View and export attendance records.</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 dark:text-white">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "MMM dd")} – {format(dateRange.to, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from) setDateRange({ from: range.from, to: range.to || range.from });
                }}
                numberOfMonths={2}
                className="dark:text-white"
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExportCSV} variant="outline" className="border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 dark:text-gray-500">Generating report...</div>
        ) : !stats || stats.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-gray-500">No data found for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300">Member</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300">Class Info</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300 text-center">Days Present</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300 text-right">Total Offering</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {stats.map((row) => (
                  <tr key={row.memberId} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{row.memberName}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">{row.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 dark:text-white">{row.className}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">{row.divisionName}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700 dark:text-gray-200">{row.totalPresent}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(row.totalOffering)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium",
                        row.attendancePercentage >= 80 ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" :
                        row.attendancePercentage >= 50 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400" :
                        "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                      )}>
                        {row.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

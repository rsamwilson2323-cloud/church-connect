import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useClasses } from "@/hooks/use-classes";
import { useMembers } from "@/hooks/use-members";
import { useAttendance, useBatchAttendance, useAttendanceSummary } from "@/hooks/use-attendance";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, Search, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface AttendanceState {
  present: boolean;
  offering: string;
}

export default function Attendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
  const [attendanceState, setAttendanceState] = useState<Record<number, AttendanceState>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const { data: classes } = useClasses();
  const { data: members, isLoading: isLoadingMembers } = useMembers({
    divisionId: selectedDivisionId || undefined,
  });

  const dateStr = format(date, "yyyy-MM-dd");
  const { data: existingAttendance, isLoading: isLoadingAttendance } = useAttendance(dateStr, selectedDivisionId);
  const { data: summary } = useAttendanceSummary(dateStr);

  const saveBatch = useBatchAttendance();
  const { toast } = useToast();

  useEffect(() => {
    if (members) {
      const newState: Record<number, AttendanceState> = {};
      members.forEach((member: any) => {
        const record = existingAttendance?.find((r: any) => r.memberId === member.id);
        newState[member.id] = {
          present: record ? record.present : false,
          offering: record && record.offering != null && record.offering !== "0" && record.offering !== "null"
            ? record.offering.toString()
            : "",
        };
      });
      setAttendanceState(newState);
    }
  }, [members, existingAttendance]);

  const togglePresent = (id: number) => {
    setAttendanceState(prev => ({ ...prev, [id]: { ...prev[id], present: !prev[id]?.present } }));
  };

  const setOffering = (id: number, value: string) => {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
    setAttendanceState(prev => ({ ...prev, [id]: { ...prev[id], offering: value } }));
  };

  const handleSave = () => {
    if (!selectedDivisionId) {
      toast({ title: "Select a section first", variant: "destructive" });
      return;
    }
    const records = Object.entries(attendanceState).map(([id, state]) => ({
      memberId: parseInt(id),
      present: state.present,
      offering: state.offering.trim() !== "" ? parseFloat(state.offering) : null,
    }));
    saveBatch.mutate({ date: dateStr, records }, {
      onSuccess: () => toast({ title: "Saved", description: "Attendance saved successfully." }),
      onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
    });
  };

  const allDivisions = classes?.flatMap((c: any) => c.divisions.map((d: any) => ({ ...d, className: c.name }))) || [];
  const filteredMembers = members?.filter((m: any) => m.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  const localPresent = Object.values(attendanceState).filter(s => s.present).length;
  const localOffering = Object.values(attendanceState).reduce((sum, s) => {
    const v = parseFloat(s.offering);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Attendance</h1>
          <p className="text-slate-500 dark:text-gray-400">Mark presence and record offerings for {format(date, "MMMM d, yyyy")}.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveBatch.isPending || !selectedDivisionId}
          className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          {saveBatch.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-56 justify-start text-left font-normal bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-600 dark:text-white">
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {format(date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
              className="dark:text-white"
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
          <SelectTrigger className="w-full md:w-64 bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-600 dark:text-white">
            <SelectValue placeholder="Select Section" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600">
            {allDivisions.map((div: any) => (
              <SelectItem key={div.id} value={div.id.toString()}>
                {div.className} — {div.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Filter members..."
            className="pl-9 bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-600 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Live totals */}
      {selectedDivisionId && filteredMembers.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-500 dark:text-blue-400 font-medium uppercase tracking-wide">Present</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{localPresent} <span className="text-sm font-normal text-blue-400">/ {filteredMembers.length}</span></p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-500 dark:text-green-400 font-medium uppercase tracking-wide">Total Offering</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">${localOffering.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {!selectedDivisionId ? (
          <div className="flex flex-col items-center justify-center h-56 text-slate-400 dark:text-gray-500">
            <CalendarIcon className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Select a section above to start marking attendance.</p>
          </div>
        ) : isLoadingMembers || isLoadingAttendance ? (
          <div className="flex items-center justify-center h-56 text-slate-400 dark:text-gray-500">Loading...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-slate-400 dark:text-gray-500 text-sm">No members found in this section.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 w-20 text-center text-sm font-semibold text-slate-600 dark:text-gray-300">Present</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 dark:text-gray-300">Member Name</th>
                <th className="px-6 py-3 w-48 text-sm font-semibold text-slate-600 dark:text-gray-300">Offering Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {filteredMembers.map((member: any) => {
                const state = attendanceState[member.id] ?? { present: false, offering: "" };
                const hasOffering = state.offering.trim() !== "" && parseFloat(state.offering) > 0;
                return (
                  <tr
                    key={member.id}
                    className={cn(
                      "transition-colors",
                      state.present ? "bg-blue-50/40 dark:bg-blue-900/10" : "hover:bg-slate-50/60 dark:hover:bg-gray-800/30"
                    )}
                  >
                    <td className="px-6 py-4 text-center">
                      <Checkbox
                        checked={state.present}
                        onCheckedChange={() => togglePresent(member.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
                        data-testid={`checkbox-present-${member.id}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{member.name}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">{member.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-36">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="(blank = none)"
                          value={state.offering}
                          onChange={(e) => setOffering(member.id, e.target.value)}
                          className={cn(
                            "pl-7 text-sm h-8 transition-all",
                            hasOffering
                              ? "border-green-300 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium"
                              : "border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                          )}
                          data-testid={`input-offering-${member.id}`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-gray-800 border-t-2 border-slate-200 dark:border-gray-700">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-gray-200">
                  Section Total — {localPresent} present
                </td>
                <td className="px-6 py-3 text-sm font-bold text-green-700 dark:text-green-400">
                  ${localOffering.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Day summary */}
      {summary && summary.byClass?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800">
            <h3 className="font-semibold text-slate-800 dark:text-white">Day Summary — {format(date, "MMMM d, yyyy")}</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Totals across all saved sections</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-gray-800">
                <th className="px-6 py-2 text-left text-slate-500 dark:text-gray-400 font-medium">Class</th>
                <th className="px-6 py-2 text-center text-slate-500 dark:text-gray-400 font-medium">Present</th>
                <th className="px-6 py-2 text-right text-slate-500 dark:text-gray-400 font-medium">Offering</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {summary.byClass.map((row: any) => (
                <tr key={row.classId}>
                  <td className="px-6 py-2 font-medium text-slate-700 dark:text-gray-200">{row.className}</td>
                  <td className="px-6 py-2 text-center text-slate-600 dark:text-gray-300">{row.present}</td>
                  <td className="px-6 py-2 text-right text-green-700 dark:text-green-400 font-medium">${Number(row.offering).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
              <tr>
                <td className="px-6 py-3 font-bold text-slate-800 dark:text-white">Grand Total</td>
                <td className="px-6 py-3 text-center font-bold text-slate-800 dark:text-white">{summary.totalPresent}</td>
                <td className="px-6 py-3 text-right font-bold text-green-700 dark:text-green-400">${Number(summary.totalOffering).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Layout>
  );
}

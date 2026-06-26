import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAttendance(date: string, divisionId: string) {
  return useQuery({
    queryKey: ["/api/attendance", date, divisionId],
    enabled: !!date && !!divisionId,
    queryFn: async () => {
      const url = new URL("/api/attendance", window.location.origin);
      url.searchParams.append("date", date);
      url.searchParams.append("divisionId", divisionId);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });
}

export function useAttendanceSummary(date: string) {
  return useQuery({
    queryKey: ["/api/attendance/summary", date],
    enabled: !!date,
    queryFn: async () => {
      const url = new URL("/api/attendance/summary", window.location.origin);
      url.searchParams.append("date", date);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });
}

export function useBatchAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { date: string; records: { memberId: number; present: boolean; offering: number | null }[] }) => {
      const res = await fetch("/api/attendance/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/stats"] });
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useReportStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [api.reports.stats.path, startDate, endDate],
    queryFn: async () => {
      const url = new URL(api.reports.stats.path, window.location.origin);
      if (startDate) url.searchParams.append("startDate", startDate);
      if (endDate) url.searchParams.append("endDate", endDate);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.reports.stats.responses[200].parse(await res.json());
    },
  });
}

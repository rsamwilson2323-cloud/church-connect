import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertMember } from "@shared/schema";

export function useMembers(filters?: { divisionId?: string; search?: string }) {
  const queryKey = [api.members.list.path, filters?.divisionId, filters?.search].filter(Boolean);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.members.list.path, window.location.origin);
      if (filters?.divisionId) url.searchParams.append("divisionId", filters.divisionId);
      if (filters?.search) url.searchParams.append("search", filters.search);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return api.members.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMember) => {
      const res = await fetch(api.members.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create member");
      return api.members.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.members.list.path] }),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertMember>) => {
      const url = buildUrl(api.members.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update member");
      return api.members.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.members.list.path] }),
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.members.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete member");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.members.list.path] }),
  });
}

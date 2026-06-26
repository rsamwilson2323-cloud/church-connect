import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CLASSES_KEY = "/api/classes";

export function useClasses() {
  return useQuery({
    queryKey: [CLASSES_KEY],
    queryFn: async () => {
      const res = await fetch(CLASSES_KEY, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create class");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CLASSES_KEY] }),
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update class");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CLASSES_KEY] }),
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete class");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CLASSES_KEY] }),
  });
}

export function useCreateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; classId: number }) => {
      const res = await fetch("/api/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create division");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CLASSES_KEY] }),
  });
}

export function useUpdateDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/divisions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update division");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CLASSES_KEY] }),
  });
}

export function useDeleteDivision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/divisions/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete division");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CLASSES_KEY] }),
  });
}

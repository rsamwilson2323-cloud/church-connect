import { useState } from "react";
import { Layout } from "@/components/Layout";
import {
  useClasses, useCreateClass, useUpdateClass, useDeleteClass,
  useCreateDivision, useUpdateDivision, useDeleteDivision
} from "@/hooks/use-classes";
import { Plus, Trash2, Network, GitBranch, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CLASS_COLORS = [
  { icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", strip: "bg-blue-500", light: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" },
  { icon: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", strip: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800" },
  { icon: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400", strip: "bg-green-500", light: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" },
  { icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", strip: "bg-amber-500", light: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" },
  { icon: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400", strip: "bg-rose-500", light: "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800" },
];

export default function Classes() {
  const { data: classes, isLoading } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const deleteDivision = useDeleteDivision();
  const { toast } = useToast();

  const [newClassName, setNewClassName] = useState("");
  const [newDivisionNames, setNewDivisionNames] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<{ type: "class" | "division"; id: number; value: string } | null>(null);

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    createClass.mutate({ name: newClassName.trim() }, {
      onSuccess: () => { setNewClassName(""); toast({ title: "Class created" }); }
    });
  };

  const handleDeleteClass = (id: number, name: string) => {
    if (confirm(`Delete class "${name}"? All its sections and members will also be removed.`)) {
      deleteClass.mutate(id, { onSuccess: () => toast({ title: "Class deleted" }) });
    }
  };

  const handleAddDivision = (classId: number) => {
    const name = newDivisionNames[classId];
    if (!name?.trim()) return;
    createDivision.mutate({ name: name.trim(), classId }, {
      onSuccess: () => {
        setNewDivisionNames(prev => ({ ...prev, [classId]: "" }));
        toast({ title: "Section created" });
      }
    });
  };

  const handleDeleteDivision = (id: number, name: string) => {
    if (confirm(`Delete section "${name}"? All members in it will also be removed.`)) {
      deleteDivision.mutate(id, { onSuccess: () => toast({ title: "Section deleted" }) });
    }
  };

  const startEdit = (type: "class" | "division", id: number, currentName: string) =>
    setEditing({ type, id, value: currentName });

  const cancelEdit = () => setEditing(null);

  const saveEdit = () => {
    if (!editing || !editing.value.trim()) return;
    if (editing.type === "class") {
      updateClass.mutate({ id: editing.id, name: editing.value.trim() }, {
        onSuccess: () => { setEditing(null); toast({ title: "Class renamed" }); },
        onError: () => toast({ title: "Failed to rename", variant: "destructive" } as any)
      });
    } else {
      updateDivision.mutate({ id: editing.id, name: editing.value.trim() }, {
        onSuccess: () => { setEditing(null); toast({ title: "Section renamed" }); },
        onError: () => toast({ title: "Failed to rename", variant: "destructive" } as any)
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Classes & Sections</h1>
        <p className="text-slate-500 dark:text-gray-400">Create, rename, or delete your classes and sections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400 dark:text-gray-500">Loading...</div>
          ) : classes?.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-gray-500">No classes yet. Add one on the right →</div>
          ) : classes?.map((cls: any, idx: number) => {
            const color = CLASS_COLORS[idx % CLASS_COLORS.length];
            return (
              <div key={cls.id} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {/* Colored top strip */}
                <div className={cn("h-1.5 w-full", color.strip)} />
                {/* Class header */}
                <div className="bg-slate-50 dark:bg-gray-800 px-5 py-4 border-b border-slate-200 dark:border-gray-700 flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color.icon)}>
                    <Network className="w-4 h-4" />
                  </div>

                  {editing?.type === "class" && editing.id === cls.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        className="h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white flex-1">{cls.name}</h3>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => startEdit("class", cls.id, cls.name)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteClass(cls.id, cls.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-5">
                  <div className="space-y-2 mb-4">
                    {cls.divisions.map((div: any) => (
                      <div key={div.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors", color.light)}>
                        <GitBranch className="w-4 h-4 text-slate-400 dark:text-gray-500 shrink-0" />
                        {editing?.type === "division" && editing.id === div.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className="h-7 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={saveEdit}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-slate-600" onClick={cancelEdit}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-200">{div.name}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => startEdit("division", div.id, div.name)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => handleDeleteDivision(div.id, div.name)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {cls.divisions.length === 0 && (
                      <p className="text-sm text-slate-400 dark:text-gray-500 italic py-1">No sections yet — add one below.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="New section name (e.g. Section A)"
                      value={newDivisionNames[cls.id] || ""}
                      onChange={(e) => setNewDivisionNames(prev => ({ ...prev, [cls.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddDivision(cls.id); }}
                      className="bg-slate-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm h-9"
                    />
                    <Button onClick={() => handleAddDivision(cls.id)} variant="outline" size="icon" className="h-9 w-9 shrink-0 dark:border-gray-600 dark:text-gray-300">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: Add Class */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm h-fit sticky top-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Add New Class</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">e.g. Beginner, Junior, Senior</p>
          <div className="space-y-3">
            <Input
              placeholder="Class name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddClass(); }}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            <Button onClick={handleAddClass} disabled={createClass.isPending} className="w-full bg-primary text-white hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Class
            </Button>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-gray-800 text-xs text-slate-400 dark:text-gray-500 space-y-1">
            <p>• Click <Pencil className="w-3 h-3 inline" /> to rename any class or section.</p>
            <p>• Click <Trash2 className="w-3 h-3 inline" /> to permanently delete.</p>
            <p>• Press Enter to confirm a rename or new entry.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

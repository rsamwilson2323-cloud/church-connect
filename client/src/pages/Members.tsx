import { useState } from "react";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/Layout";
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@/hooks/use-members";
import { useClasses } from "@/hooks/use-classes";
import { Plus, Search, Trash2, Filter, User, Pencil } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const memberFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Role is required"),
  divisionId: z.coerce.number().min(1, "Please select a section"),
});
type MemberFormValues = z.infer<typeof memberFormSchema>;

const CLASS_ACCENT_COLORS = [
  "border-l-blue-400",
  "border-l-purple-400",
  "border-l-green-400",
  "border-l-amber-400",
  "border-l-rose-400",
];

export default function Members() {
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const { data: members, isLoading } = useMembers({
    search: search || undefined,
    divisionId: divisionFilter && divisionFilter !== "all" ? divisionFilter : undefined,
  });
  const { data: classes } = useClasses();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const { toast } = useToast();

  const addForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { name: "", type: "Student", divisionId: 0 },
  });

  const editForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { name: "", type: "Student", divisionId: 0 },
  });

  const allDivisions = classes?.flatMap((c: any) => c.divisions.map((d: any) => ({ ...d, className: c.name }))) || [];

  // Map classId → color index
  const classColorMap: Record<number, number> = {};
  classes?.forEach((c: any, i: number) => { classColorMap[c.id] = i; });

  const onAdd = (values: MemberFormValues) => {
    createMember.mutate(values, {
      onSuccess: () => {
        setAddDialogOpen(false);
        addForm.reset();
        toast({ title: "Member added", description: `${values.name} has been added.` });
      },
      onError: () => toast({ title: "Error", description: "Failed to add member.", variant: "destructive" }),
    });
  };

  const openEdit = (member: any) => {
    setEditingMember(member);
    editForm.reset({ name: member.name, type: member.type, divisionId: member.divisionId });
    setEditDialogOpen(true);
  };

  const onEdit = (values: MemberFormValues) => {
    if (!editingMember) return;
    updateMember.mutate({ id: editingMember.id, ...values }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setEditingMember(null);
        toast({ title: "Member updated" });
      },
      onError: () => toast({ title: "Error", description: "Failed to update member.", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete member "${name}"? This will also remove their attendance records.`)) {
      deleteMember.mutate(id, { onSuccess: () => toast({ title: "Member deleted" }) });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Members</h1>
          <p className="text-slate-500 dark:text-gray-400">Manage students and teachers.</p>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
            <DialogHeader><DialogTitle className="dark:text-white">Add New Member</DialogTitle></DialogHeader>
            <MemberForm
              form={addForm}
              allDivisions={allDivisions}
              onSubmit={onAdd}
              onCancel={() => setAddDialogOpen(false)}
              isPending={createMember.isPending}
              submitLabel="Add Member"
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader><DialogTitle className="dark:text-white">Edit Member</DialogTitle></DialogHeader>
          <MemberForm
            form={editForm}
            allDivisions={allDivisions}
            onSubmit={onEdit}
            onCancel={() => setEditDialogOpen(false)}
            isPending={updateMember.isPending}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-slate-200 bg-slate-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-full border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 dark:text-white">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                <SelectValue placeholder="All Sections" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600">
              <SelectItem value="all">All Sections</SelectItem>
              {allDivisions.map((div: any) => (
                <SelectItem key={div.id} value={div.id.toString()}>
                  {div.className} — {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-gray-400">Loading members...</div>
        ) : members?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No members found</h3>
            <p className="text-slate-500 dark:text-gray-400 mt-1">Try adjusting filters or add a new member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300">Name</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300">Role</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300">Class / Section</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-700 dark:text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {members?.map((member: any) => {
                  const classIdx = classColorMap[member.division?.class?.id] ?? 0;
                  const accentColor = CLASS_ACCENT_COLORS[classIdx % CLASS_ACCENT_COLORS.length];
                  return (
                    <tr key={member.id} className={cn("hover:bg-slate-50/80 dark:hover:bg-gray-800/50 transition-colors border-l-4", accentColor)}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{member.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium",
                          member.type === "Teacher"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        )}>
                          {member.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-gray-300">
                        <span className="font-medium">{member.division?.class?.name}</span>
                        <span className="text-slate-300 dark:text-gray-600 mx-1">/</span>
                        {member.division?.name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => openEdit(member)}
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            data-testid={`button-edit-member-${member.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => handleDelete(member.id, member.name)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            data-testid={`button-delete-member-${member.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

function MemberForm({ form, allDivisions, onSubmit, onCancel, isPending, submitLabel }: {
  form: any;
  allDivisions: any[];
  onSubmit: (v: MemberFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-300">Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" className="dark:bg-gray-800 dark:border-gray-600 dark:text-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-300">Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600">
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="divisionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-300">Section</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600">
                    {allDivisions.map((div: any) => (
                      <SelectItem key={div.id} value={div.id.toString()}>
                        {div.className} — {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="dark:border-gray-600 dark:text-gray-300">Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

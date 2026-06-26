import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Save, Sun, Moon } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const profileMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/settings/profile", { displayName }),
    onSuccess: async (res) => {
      const updated = await res.json();
      queryClient.setQueryData(["/api/user"], updated);
      toast({ title: "Name updated successfully" });
    },
    onError: async (err: any) => {
      const body = err.response ? await err.response.json().catch(() => ({})) : {};
      toast({ title: "Failed to update name", description: body.message || err.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/settings/password", { currentPassword, newPassword }),
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: async (err: any) => {
      let message = err.message;
      try { const body = await err.response?.json(); if (body?.message) message = body.message; } catch {}
      toast({ title: "Failed to change password", description: message, variant: "destructive" });
    },
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    profileMutation.mutate();
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    passwordMutation.mutate();
  };

  return (
    <Layout>
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-gray-400">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl">
        {/* Display Name */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white">Display Name</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">The name shown in the sidebar</p>
            </div>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={user?.username || ""}
                disabled
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Username cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                data-testid="input-display-name"
              />
            </div>
            <button
              type="submit"
              disabled={profileMutation.isPending || !displayName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              data-testid="button-save-profile"
            >
              <Save className="w-4 h-4" />
              {profileMutation.isPending ? "Saving…" : "Save Name"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white">Change Password</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">Enter your current password to set a new one</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                data-testid="input-current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                data-testid="input-new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                data-testid="input-confirm-password"
              />
            </div>
            <button
              type="submit"
              disabled={passwordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              data-testid="button-save-password"
            >
              <Lock className="w-4 h-4" />
              {passwordMutation.isPending ? "Updating…" : "Change Password"}
            </button>
          </form>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              {theme === "dark" ? <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Sun className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white">Appearance</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">Choose light or dark mode</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme("light")}
              data-testid="button-theme-light"
              className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Light Mode</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Bright and clean</p>
              </div>
              {theme === "light" && (
                <span className="text-xs font-medium text-primary">● Active</span>
              )}
            </button>
            <button
              onClick={() => setTheme("dark")}
              data-testid="button-theme-dark"
              className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === "dark"
                  ? "border-primary bg-primary/10"
                  : "border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Moon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">Easy on the eyes</p>
              </div>
              {theme === "dark" && (
                <span className="text-xs font-medium text-primary">● Active</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

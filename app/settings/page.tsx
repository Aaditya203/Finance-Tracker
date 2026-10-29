"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bot,
  CheckCircle2,
  KeyRound,
  LogOut,
  Pencil,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCurrentUser } from "@/components/providers/current-user-provider";
import { getUsersApi, updateProfileApi } from "@/lib/api/users";
import { changePasswordApi, logoutApi } from "@/lib/api/auth";
import { WorkspaceUser } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, isMounted, refetchUser } = useCurrentUser();
  const [partners, setPartners] = useState<WorkspaceUser[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    getUsersApi()
      .then((data) => {
        if (!isCancelled) {
          setPartners(data || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingPartners(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLogoutAll = async () => {
    try {
      await logoutApi();
    } catch {}
    localStorage.removeItem("flextudy-current-user-id");
    router.push("/sign-in");
  };

  const userName = isMounted && user?.name ? user.name : "Partner";
  const userEmail = isMounted && user?.email ? user.email : "";
  const userInitials = userName !== "Partner"
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  const isTelegramConnected = Boolean(isMounted && user?.telegramUserID);

  return (
    <div className="min-h-screen bg-[var(--color-cream-canvas)] selection:bg-[var(--color-marigold-glow)] selection:text-[var(--color-ink-black)] md:flex">
      <Sidebar />
      <MobileNav />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 md:p-8 lg:p-10">
        <div className="mx-auto max-w-5xl space-y-7">
          <header className="border-b border-[var(--color-parchment-shadow)]/70 pb-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-harvest-flame)]">
              Partner finance
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink-black)] sm:text-4xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-[var(--color-warm-stone)] sm:text-base">
              Manage your account and workspace preferences.
            </p>
          </header>

          {/* Profile Section */}
          <SettingsSection
            title="Profile Information"
            description="Your account details in this private workspace."
            icon={UserRound}
          >
            <Card className="border-[var(--color-parchment-shadow)] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <Avatar initials={userInitials} large />
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-ink-black)]">
                      {loading ? "Loading..." : userName}
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--color-warm-stone)]">
                      {loading ? "..." : userEmail}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[var(--color-driftwood)]">
                      Email address cannot be changed here.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setEditOpen(true)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Pencil className="h-4 w-4 text-[var(--color-harvest-flame)]" /> Edit Profile
                </Button>
              </div>
            </Card>
          </SettingsSection>

          {/* Security Section */}
          <SettingsSection
            title="Security"
            description="Keep your account secure."
            icon={ShieldCheck}
          >
            <Card className="border-[var(--color-parchment-shadow)] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold text-[var(--color-ink-black)]">Password</h3>
                  <p className="mt-1 font-mono tracking-[0.2em] text-[var(--color-warm-stone)]">
                    ••••••••••
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setPasswordOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <KeyRound className="h-4 w-4 text-[var(--color-harvest-flame)]" /> Change Password
                </Button>
              </div>
            </Card>
          </SettingsSection>

          {/* Telegram Section */}
          <SettingsSection
            title="Telegram Connection"
            description="Connect with the finance bot to record updates from Telegram."
            icon={Bot}
          >
            <Card
              className={`border p-5 sm:p-6 ${
                isTelegramConnected ? "border-[var(--color-marigold-glow)]" : "border-[var(--color-parchment-shadow)]"
              }`}
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isTelegramConnected
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                        : "bg-[var(--color-cream-canvas)] text-[var(--color-driftwood)]"
                    }`}
                  >
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--color-ink-black)]">
                        {isTelegramConnected ? "Connected" : "Not Connected"}
                      </h3>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isTelegramConnected ? "bg-emerald-500 dark:bg-emerald-400" : "bg-[var(--color-bone)]"
                        }`}
                      />
                    </div>
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--color-warm-stone)]">
                      {isTelegramConnected
                        ? `Linked Telegram ID: @${user?.telegramUserID}`
                        : "Connect your Telegram account ID to add expenses and settlements directly from Telegram."}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isTelegramConnected ? "secondary" : "primary"}
                  onClick={() => setTelegramOpen(true)}
                  className="w-full sm:w-auto"
                >
                  {isTelegramConnected ? "Manage Connection" : "Connect Telegram"}
                </Button>
              </div>
            </Card>
          </SettingsSection>

          {/* Workspace Partners Section */}
          <SettingsSection
            title="Partner Workspace"
            description="This is a private workspace with only authorized partners."
            icon={UsersRound}
          >
            <Card className="border-[var(--color-parchment-shadow)] p-0">
              <div className="border-b border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)]/60 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-stone)]">
                {isLoadingPartners
                  ? "Loading workspace partners..."
                  : `${partners.length} authorized partner${partners.length !== 1 ? "s" : ""}`}
              </div>
              <div className="divide-y divide-[var(--color-parchment-shadow)]/70">
                {partners.map((partner) => {
                  const isYou = user?.id === partner.id || user?.email === partner.email;
                  const initials = partner.name
                    ? partner.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                    : "--";
                  return (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar initials={initials} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--color-ink-black)]">
                              {partner.name}
                            </p>
                            {isYou && (
                              <span className="rounded-full bg-[var(--color-harvest-flame)]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-harvest-flame)]">
                                You
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-[var(--color-driftwood)]">
                            {partner.email}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--color-success)]">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        <span className="hidden sm:inline">Authorized</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </SettingsSection>

          {/* Danger Zone */}
          <section className="border-t border-[var(--color-parchment-shadow)] pt-7">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[var(--color-ink-black)]">Danger Zone</h2>
              <p className="mt-0.5 text-sm text-[var(--color-warm-stone)]">
                Actions that affect your current session.
              </p>
            </div>
            <Card className="border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold text-[var(--color-ink-black)]">Log out of session</h3>
                  <p className="mt-1 text-sm text-[var(--color-warm-stone)]">
                    End active session and return to sign in screen.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogoutAll}
                  className="w-full border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 sm:w-auto cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {editOpen && (
        <EditProfileModal
          initialName={userName}
          initialEmail={userEmail}
          onClose={() => setEditOpen(false)}
          onSuccess={async () => {
            await refetchUser();
            const updatedPartners = await getUsersApi();
            setPartners(updatedPartners);
            setEditOpen(false);
          }}
        />
      )}

      {/* Change Password Modal */}
      {passwordOpen && (
        <ChangePasswordModal onClose={() => setPasswordOpen(false)} />
      )}

      {/* Telegram Modal */}
      {telegramOpen && (
        <TelegramModal
          initialTelegramId={user?.telegramUserID || ""}
          onClose={() => setTelegramOpen(false)}
          onSuccess={async () => {
            await refetchUser();
            setTelegramOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-2.5">
        <div className="mt-0.5 text-[var(--color-harvest-flame)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink-black)]">{title}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-warm-stone)]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Avatar({ initials, large = false }: { initials: string; large?: boolean }) {
  return (
    <div
      className={`${
        large ? "h-14 w-14 text-base" : "h-10 w-10 text-xs"
      } flex shrink-0 items-center justify-center rounded-full bg-[var(--color-harvest-flame)] font-bold text-white shadow-sm`}
    >
      {initials}
    </div>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-[var(--color-overlay)] backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-t-[24px] border border-[var(--color-parchment-shadow)] bg-[var(--color-surface)] p-5 shadow-2xl sm:rounded-xl sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-parchment-shadow)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-ink-black)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--color-warm-stone)]">{description}</p>
          </div>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--color-driftwood)] hover:bg-[var(--color-cream-canvas)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditProfileModal({
  initialName,
  initialEmail,
  onClose,
  onSuccess,
}: {
  initialName: string;
  initialEmail: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateProfileApi({ name: name.trim() });
      await onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      setIsSubmitting(false);
    }
  };

  const initials = name.trim()
    ? name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "P";

  return (
    <Modal
      title="Edit Profile"
      description="Update your display name in the workspace."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-5">
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Avatar initials={initials} large />
          <div>
            <p className="text-sm font-bold text-[var(--color-ink-black)]">{name || "Partner Name"}</p>
            <p className="text-xs text-[var(--color-driftwood)]">{initialEmail}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
            Full Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)]">
            Email Address
          </p>
          <p className="mt-1.5 text-sm font-medium text-[var(--color-warm-stone)]">{initialEmail}</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-parchment-shadow)] pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await changePasswordApi({ currentPassword, newPassword });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Change Password"
      description="Use a strong password you do not use elsewhere."
      onClose={onClose}
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700 dark:text-emerald-400 animate-bounce" />
          <h3 className="font-bold text-lg text-[var(--color-ink-black)]">Password Updated Successfully!</h3>
          <p className="text-xs text-[var(--color-warm-stone)]">Your account credentials have been updated.</p>
          <Button size="sm" onClick={onClose} className="mt-4">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-5">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
              Current Password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--color-parchment-shadow)] pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function TelegramModal({
  initialTelegramId,
  onClose,
  onSuccess,
}: {
  initialTelegramId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [telegramId, setTelegramId] = useState(initialTelegramId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (newId: string | null) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateProfileApi({ telegramUserID: newId });
      await onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update Telegram ID");
      setIsSubmitting(false);
    }
  };

  const isConnected = Boolean(initialTelegramId);

  return (
    <Modal
      title={isConnected ? "Manage Telegram Connection" : "Connect Telegram"}
      description={
        isConnected
          ? "Your account is linked to the Telegram finance bot."
          : "Link your Telegram User ID or handle to record expenses directly from Telegram."
      }
      onClose={onClose}
    >
      <div className="space-y-4 py-5">
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-parchment-shadow)] bg-[var(--color-cream-canvas)] p-4">
          <Bot className="h-6 w-6 text-[var(--color-harvest-flame)] shrink-0" />
          <div>
            <p className="font-semibold text-[var(--color-ink-black)]">Finance Tracker Bot</p>
            <p className="text-xs text-[var(--color-warm-stone)]">
              {isConnected ? `Linked ID: @${initialTelegramId}` : "No Telegram account linked"}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-black)] mb-1.5">
            Telegram Username / User ID
          </label>
          <Input
            placeholder="e.g. aditya_sharma"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-parchment-shadow)] pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {isConnected && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(null)}
              disabled={isSubmitting}
              className="border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Disconnect
            </Button>
          )}
          <Button
            type="button"
            onClick={() => handleSave(telegramId.trim())}
            disabled={isSubmitting || !telegramId.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Connection"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

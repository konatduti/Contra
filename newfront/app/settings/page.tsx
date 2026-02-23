"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CreditCard,
  RotateCcw,
  Shield,
  Sliders,
  User
} from "lucide-react";

import {
  USER_SETTINGS_KEY,
  defaultUserSettings,
  loadUserSettings,
  saveUserSettings,
  type UserSettings
} from "@/lib/user-settings";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRole } from "@/components/auth/RoleProvider";

const creditsSnapshot = {
  monthly: 1240,
  oneOff: 320,
  resetDate: "Nov 1, 2024",
  resetsInDays: 19
};

const sectionItems = [
  { id: "account", label: "Account", icon: User },
  { id: "workspace", label: "Workspace", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle }
];

const activeSessions = [
  {
    id: "session-1",
    device: "MacBook Pro · Chrome",
    location: "San Francisco, CA",
    lastActive: "Active now"
  },
  {
    id: "session-2",
    device: "iPhone 15 · Safari",
    location: "New York, NY",
    lastActive: "2 days ago"
  },
  {
    id: "session-3",
    device: "Surface Laptop · Edge",
    location: "Austin, TX",
    lastActive: "5 days ago"
  }
];

export default function SettingsPage() {
  const { role } = useRole();
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [fullName, setFullName] = useState("Jane Doe");
  const [email] = useState("jane@contra.ai");
  const [toast, setToast] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setSettings(loadUserSettings());
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const triggerToast = (message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const compactLayout = settings.compactMode;
  const layoutSpacing = compactLayout ? "space-y-6" : "space-y-8";
  const gridSpacing = compactLayout ? "gap-4" : "gap-6";
  const roleLabel = role === "admin" ? "Admin" : "User";

  const creditSummary = useMemo(
    () => [
      { label: "Monthly credits remaining", value: creditsSnapshot.monthly.toLocaleString() },
      { label: "One-off credits remaining", value: creditsSnapshot.oneOff.toLocaleString() },
      {
        label: "Reset schedule",
        value: `${creditsSnapshot.resetDate} · Resets in ${creditsSnapshot.resetsInDays} days`
      }
    ],
    []
  );

  const handleSaveSettings = (message: string) => {
    saveUserSettings(settings);
    triggerToast(message);
  };

  const handleResetLocalSettings = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_SETTINGS_KEY);
    }
    setSettings(defaultUserSettings);
    triggerToast("Local settings reset.");
    window.setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className={"relative pb-20 " + layoutSpacing}>
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-lg">
          {toast}
        </div>
      ) : null}
      <div>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <div className="rounded-xl border border-slate-200/70 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</p>
            <SettingsNav items={sectionItems} className="mt-3" />
          </div>
        </div>

        <div className={layoutSpacing}>
          <section id="account" className="scroll-mt-24">
            <SettingsSection
              title="Account"
              description="Update profile, access, and workspace appearance."
              compact={compactLayout}
              icon={<User className="h-4 w-4" />}
            >
              <div className={"grid " + gridSpacing}>
                <div className="rounded-lg border border-slate-200/70 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="full-name">
                        Full name
                      </label>
                      <Input
                        id="full-name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700" htmlFor="email-address">
                        Email
                      </label>
                      <Input id="email-address" value={email} disabled />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Role</p>
                    <p className="text-xs text-slate-500">Access level for your workspace.</p>
                  </div>
                  <Badge variant="muted">{roleLabel}</Badge>
                </div>

                <div className="rounded-lg border border-slate-200/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">Appearance & language</p>
                    <p className="text-xs text-slate-500">
                      Personalize the UI for long-form document review.
                    </p>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Theme</label>
                      <Select
                        value={settings.theme}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            theme: value as UserSettings["theme"]
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Language</label>
                      <Select
                        value={settings.language}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            language: value as UserSettings["language"]
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hu">Hungarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">Reduce motion</p>
                        <p className="text-xs text-slate-500">Limit animations for accessibility.</p>
                      </div>
                      <Switch
                        checked={settings.reduceMotion}
                        onCheckedChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            reduceMotion: value
                          }))
                        }
                        aria-label="Reduce motion"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">Compact mode</p>
                        <p className="text-xs text-slate-500">Tighten spacing in settings.</p>
                      </div>
                      <Switch
                        checked={settings.compactMode}
                        onCheckedChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            compactMode: value
                          }))
                        }
                        aria-label="Compact mode"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={() => handleSaveSettings("Account changes saved.")}>Save changes</Button>
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Change password</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Change password</DialogTitle>
                      <DialogDescription>
                        Choose a strong password to keep your account secure.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium text-slate-700"
                          htmlFor="current-password"
                        >
                          Current password
                        </label>
                        <Input id="current-password" type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="new-password">
                          New password
                        </label>
                        <Input id="new-password" type="password" placeholder="Create a new password" />
                      </div>
                      <div className="space-y-2">
                        <label
                          className="text-sm font-medium text-slate-700"
                          htmlFor="confirm-password"
                        >
                          Confirm new password
                        </label>
                        <Input id="confirm-password" type="password" placeholder="Repeat new password" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          triggerToast("Password updated.");
                          setPasswordDialogOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </SettingsSection>
          </section>

          <section id="workspace" className="scroll-mt-24">
            <SettingsSection
              title="Workspace"
              description="Tune how Contra analyzes and formats documents."
              compact={compactLayout}
              icon={<Sliders className="h-4 w-4" />}
            >
              <div className={"grid " + gridSpacing}>
                <div className="rounded-lg border border-slate-200/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">AI behavior</p>
                    <p className="text-xs text-slate-500">
                      Default settings for clause review and reports.
                    </p>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Default analysis depth</label>
                      <Select
                        value={settings.workspace.analysisDepth}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            workspace: {
                              ...prev.workspace,
                              analysisDepth: value as UserSettings["workspace"]["analysisDepth"]
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select depth" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fast">Fast</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="thorough">Thorough</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Preferred report format</label>
                      <Select
                        value={settings.workspace.reportFormat}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            workspace: {
                              ...prev.workspace,
                              reportFormat: value as UserSettings["workspace"]["reportFormat"]
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="docx">DOCX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Default risk threshold</label>
                      <Select
                        value={settings.workspace.riskThreshold}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            workspace: {
                              ...prev.workspace,
                              riskThreshold: value as UserSettings["workspace"]["riskThreshold"]
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select threshold" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">Auto-run analysis after upload</p>
                        <p className="text-xs text-slate-500">Start review as soon as files arrive.</p>
                      </div>
                      <Switch
                        checked={settings.workspace.autoRunAnalysis}
                        onCheckedChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            workspace: {
                              ...prev.workspace,
                              autoRunAnalysis: value
                            }
                          }))
                        }
                        aria-label="Auto-run analysis"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">Show clause confidence scores</p>
                        <p className="text-xs text-slate-500">Surface model certainty in summaries.</p>
                      </div>
                      <Switch
                        checked={settings.workspace.showClauseConfidence}
                        onCheckedChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            workspace: {
                              ...prev.workspace,
                              showClauseConfidence: value
                            }
                          }))
                        }
                        aria-label="Show clause confidence scores"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">Document handling</p>
                    <p className="text-xs text-slate-500">
                      Control retention, redaction, and export safeguards.
                    </p>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">Redact sensitive data in exports</p>
                        <p className="text-xs text-slate-500">Replace PII with secure placeholders.</p>
                      </div>
                      <Switch
                        checked={settings.documents.redactSensitiveExports}
                        onCheckedChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            documents: {
                              ...prev.documents,
                              redactSensitiveExports: value
                            }
                          }))
                        }
                        aria-label="Redact sensitive data in exports"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Auto-delete uploaded files after
                      </label>
                      <Select
                        value={settings.documents.autoDeleteAfter}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            documents: {
                              ...prev.documents,
                              autoDeleteAfter: value as UserSettings["documents"]["autoDeleteAfter"]
                            }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select retention" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">7 days</SelectItem>
                          <SelectItem value="30d">30 days</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Retention only applies to future uploads.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSaveSettings("Workspace settings saved.")}>Save workspace settings</Button>
              </div>
            </SettingsSection>
          </section>

          <section id="notifications" className="scroll-mt-24">
            <SettingsSection
              title="Notifications"
              description="Choose how Contra keeps you informed."
              compact={compactLayout}
              icon={<Bell className="h-4 w-4" />}
            >
              <div className={"grid " + gridSpacing}>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">High-risk alerts</p>
                    <p className="text-xs text-slate-500">Get emailed when risk is detected.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.highRisk}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          highRisk: value
                        }
                      }))
                    }
                    aria-label="Email alerts for high-risk documents"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Notify when analysis completes</p>
                    <p className="text-xs text-slate-500">Receive a message when reviews finish.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.analysisComplete}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          analysisComplete: value
                        }
                      }))
                    }
                    aria-label="Notify when analysis completes"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Weekly usage summary</p>
                    <p className="text-xs text-slate-500">A snapshot every Monday morning.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weekly}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          weekly: value
                        }
                      }))
                    }
                    aria-label="Weekly usage summary"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Product updates</p>
                    <p className="text-xs text-slate-500">News about releases and features.</p>
                  </div>
                  <Switch
                    checked={settings.notifications.updates}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          updates: value
                        }
                      }))
                    }
                    aria-label="Product updates"
                  />
                </div>
                <div className="rounded-lg border border-slate-200/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Notify on credit low (below X)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={settings.notifications.creditLowThreshold}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              creditLowThreshold: Number(event.target.value)
                            }
                          }))
                        }
                      />
                      <p className="text-xs text-slate-500">Alerts when credits drop below your threshold.</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Enable credit alerts</p>
                        <p className="text-xs text-slate-500">Email + in-app notification.</p>
                      </div>
                      <Switch
                        checked={settings.notifications.creditLowEnabled}
                        onCheckedChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              creditLowEnabled: value
                            }
                          }))
                        }
                        aria-label="Enable credit alerts"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSaveSettings("Notification settings saved.")}>Save notification settings</Button>
              </div>
            </SettingsSection>
          </section>

          <section id="privacy" className="scroll-mt-24">
            <SettingsSection
              title="Privacy & Security"
              description="Manage data access, session security, and audits."
              compact={compactLayout}
              icon={<Shield className="h-4 w-4" />}
            >
              <div className={"grid " + gridSpacing}>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Two-factor authentication (2FA)</p>
                    <p className="text-xs text-slate-500">Extra protection for privileged actions.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Coming soon</Badge>
                    <Switch
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            twoFactorEnabled: value
                          }
                        }))
                      }
                      aria-label="Two-factor authentication"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200/70 p-4 space-y-2">
                  <label className="text-sm font-medium text-slate-700">Session timeout</label>
                  <Select
                    value={settings.privacy.sessionTimeout}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        privacy: {
                          ...prev.privacy,
                          sessionTimeout: value as UserSettings["privacy"]["sessionTimeout"]
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="30m">30 minutes</SelectItem>
                      <SelectItem value="60m">60 minutes</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Applies to all browser sessions.</p>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Active sessions</p>
                    <p className="text-xs text-slate-500">Review and revoke trusted devices.</p>
                  </div>
                  <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">View sessions</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Active sessions</DialogTitle>
                        <DialogDescription>
                          Revoke access for any device you do not recognize.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        {activeSessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex flex-col gap-3 rounded-lg border border-slate-200/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">{session.device}</p>
                              <p className="text-xs text-slate-500">
                                {session.location} · {session.lastActive}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => triggerToast("Session revoked.")}
                            >
                              Revoke
                            </Button>
                          </div>
                        ))}
                      </div>
                      <DialogFooter>
                        <Button onClick={() => setSessionsDialogOpen(false)}>Done</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-slate-200/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Export audit log</p>
                    <p className="text-xs text-slate-500">Download a record of data access.</p>
                  </div>
                  <Button variant="outline" onClick={() => triggerToast("Audit log exported.")}
                  >
                    Export audit log
                  </Button>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" onClick={() => triggerToast("Data export started.")}
                >
                  Download my data
                </Button>
                <Button variant="outline" onClick={() => triggerToast("Signed out successfully.")}
                >
                  Sign out
                </Button>
                <Button onClick={() => handleSaveSettings("Privacy settings saved.")}>Save privacy settings</Button>
              </div>
            </SettingsSection>
          </section>

          <section id="billing" className="scroll-mt-24">
            <SettingsSection
              title="Billing"
              description="Track your credits and upcoming renewals."
              compact={compactLayout}
              icon={<CreditCard className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="grid gap-3">
                  {creditSummary.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">Updated moments ago</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex w-full">
                        <Button className="w-full" disabled>
                          Manage billing
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Coming soon</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </SettingsSection>
          </section>

          <section id="danger" className="scroll-mt-24">
            <SettingsSection
              title="Danger Zone"
              description="Be careful—these actions are irreversible."
              compact={compactLayout}
              className="border-rose-200"
              icon={<AlertTriangle className="h-4 w-4" />}
            >
              <div className={"grid " + gridSpacing}>
                <div className="rounded-lg border border-rose-200/70 p-4">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-rose-400" />
                    <p className="text-sm font-semibold text-rose-600">Reset local settings</p>
                  </div>
                  <p className="mt-2 text-xs text-rose-500">
                    Clear saved preferences from this browser and start fresh.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="mt-3">
                        Reset local settings
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset local settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This clears your saved preferences from this browser only.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button variant="destructive" onClick={handleResetLocalSettings}>
                            Confirm reset
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="rounded-lg border border-rose-200/70 p-4">
                  <p className="text-sm font-semibold text-rose-600">Delete account</p>
                  <p className="mt-2 text-xs text-rose-500">
                    Deleting your account removes all documents and audit history.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="mt-3">
                        Delete account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action is permanent. Your files and settings will be removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                          <Button
                            variant="destructive"
                            onClick={() => triggerToast("Account deletion requested.")}
                          >
                            Confirm delete
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </SettingsSection>
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, FileText, PlusCircle, Send, Settings, Trash2 } from "lucide-react";

import { AdminGate } from "@/components/auth/AdminGate";
import { RecentActivityDialog } from "@/components/admin/RecentActivityDialog";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  loadLegalBannerSettings,
  saveLegalBannerSettings,
  type LegalBannerSettings
} from "@/lib/legal-docs";
import {
  accessRequests,
  activityEntries,
  adminUsers,
  companies,
  creditHistoryEntries
} from "@/lib/mock-admin";

export default function PlatformAdminPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [piiSanitiser, setPiiSanitiser] = useState(true);
  const [legalBannerSettings, setLegalBannerSettings] = useState<LegalBannerSettings>(
    loadLegalBannerSettings
  );

  useEffect(() => {
    setLegalBannerSettings(loadLegalBannerSettings());
  }, []);

  const [companyFilter, setCompanyFilter] = useState("");
  const [companyList, setCompanyList] = useState(companies);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    seats: "",
    monthlyCredits: "",
    oneOffCredits: ""
  });

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    credits: "",
    companyId: "none",
    isAdmin: false,
    isOrganiser: true
  });

  const [users, setUsers] = useState(adminUsers);
  const [creditHistoryOpen, setCreditHistoryOpen] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    if (!companyFilter) return companyList;
    return companyList.filter((company) =>
      company.name.toLowerCase().includes(companyFilter.toLowerCase())
    );
  }, [companyFilter, companyList]);

  const triggerToast = (messageText: string) => {
    setToast(messageText);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleCreateCompany = () => {
    if (!companyForm.name) {
      triggerToast("Add a company name before creating.");
      return;
    }

    setCompanyList((prev) => [
      ...prev,
      {
        id: companyForm.name.toLowerCase().replace(/\s+/g, "-"),
        name: companyForm.name,
        seats: Number(companyForm.seats || 0),
        monthlyCredits: Number(companyForm.monthlyCredits || 0),
        oneOffCredits: Number(companyForm.oneOffCredits || 0)
      }
    ]);
    setCompanyForm({ name: "", seats: "", monthlyCredits: "", oneOffCredits: "" });
    triggerToast("Company created.");
  };

  const handleCreateUser = () => {
    if (!userForm.username || !userForm.email || !userForm.password) {
      triggerToast("Complete the user form before creating.");
      return;
    }

    setUsers((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        username: userForm.username,
        email: userForm.email,
        companyId: userForm.companyId === "none" ? undefined : userForm.companyId,
        roleAdmin: userForm.isAdmin,
        roleOrganiser: userForm.isOrganiser,
        credits: Number(userForm.credits || 0)
      }
    ]);

    setUserForm({
      username: "",
      email: "",
      password: "",
      credits: "",
      companyId: "none",
      isAdmin: false,
      isOrganiser: true
    });
    triggerToast("User created.");
  };

  return (
    <AdminGate>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <TopBar title="Admin Dashboard" />
        <div className="flex flex-1 min-h-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={() => triggerToast("Total companies: 12")}
            >
              Total companies registered
            </Button>
            <Button variant="outline" className="border-slate-300" onClick={() => setActivityOpen(true)}>
              <Activity className="mr-2 h-4 w-4" />
              Activity
            </Button>
            <Button asChild variant="outline" className="border-slate-300">
              <Link href="/platform-admin/legal-docs">
                <FileText className="mr-2 h-4 w-4" />
                Edit legal docs
              </Link>
            </Button>
            <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                  <Send className="mr-2 h-4 w-4" />
                  Send message
                </Button>
              </DialogTrigger>
              <DialogContent className="h-auto max-w-lg">
                <DialogHeader>
                  <DialogTitle>Send platform message</DialogTitle>
                </DialogHeader>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[140px] w-full rounded-md border border-input px-3 py-2 text-sm"
                  placeholder="Write a message to all organisers..."
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMessageOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                    onClick={() => {
                      triggerToast("Message sent.");
                      setMessageOpen(false);
                      setMessage("");
                    }}
                  >
                    Send
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Pending access requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.contact}</TableCell>
                        <TableCell>{request.username}</TableCell>
                        <TableCell>{request.company}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                          {request.message}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button className="bg-amber-400 text-amber-950 hover:bg-amber-300">
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Platform settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={piiSanitiser} onCheckedChange={setPiiSanitiser} />
                <span className="text-sm">Enable PII sanitiser</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={legalBannerSettings.termsUpdated}
                  onCheckedChange={(checked) =>
                    setLegalBannerSettings((prev) => ({ ...prev, termsUpdated: checked }))
                  }
                />
                <span className="text-sm">Show Terms & Conditions update banner</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={legalBannerSettings.privacyUpdated}
                  onCheckedChange={(checked) =>
                    setLegalBannerSettings((prev) => ({ ...prev, privacyUpdated: checked }))
                  }
                />
                <span className="text-sm">Show Privacy Policy update banner</span>
              </div>
              <Button
                className="bg-amber-400 text-amber-950 hover:bg-amber-300"
                onClick={() => {
                  saveLegalBannerSettings(legalBannerSettings);
                  triggerToast("Settings saved.");
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Save
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1.5fr_0.5fr_0.6fr_0.6fr_auto]">
                <Input
                  value={companyForm.name}
                  onChange={(event) => setCompanyForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Company name"
                />
                <Input
                  value={companyForm.seats}
                  onChange={(event) => setCompanyForm((prev) => ({ ...prev, seats: event.target.value }))}
                  placeholder="Seats"
                  type="number"
                />
                <Input
                  value={companyForm.monthlyCredits}
                  onChange={(event) =>
                    setCompanyForm((prev) => ({ ...prev, monthlyCredits: event.target.value }))
                  }
                  placeholder="Monthly credits"
                  type="number"
                />
                <Input
                  value={companyForm.oneOffCredits}
                  onChange={(event) =>
                    setCompanyForm((prev) => ({ ...prev, oneOffCredits: event.target.value }))
                  }
                  placeholder="One-off credits"
                  type="number"
                />
                <Button
                  className="bg-amber-400 text-amber-950 hover:bg-amber-300"
                  onClick={handleCreateCompany}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </div>

              <Input
                value={companyFilter}
                onChange={(event) => setCompanyFilter(event.target.value)}
                placeholder="Filter companies"
              />

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.seats}</TableCell>
                        <TableCell>
                          Monthly: {company.monthlyCredits}, One-off: {company.oneOffCredits}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button asChild className="bg-amber-400 text-amber-950 hover:bg-amber-300">
                              <Link href={`/company-organizer/${company.id}`}>Open</Link>
                            </Button>
                            <Button className="bg-red-500 text-white hover:bg-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Create user</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr_1fr_0.6fr_1fr_0.8fr_auto]">
                <Input
                  value={userForm.username}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="Username"
                />
                <Input
                  value={userForm.email}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                />
                <Input
                  value={userForm.password}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                  type="password"
                />
                <Input
                  value={userForm.credits}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, credits: event.target.value }))}
                  placeholder="Credits"
                  type="number"
                />
                <Select
                  value={userForm.companyId}
                  onValueChange={(value) => setUserForm((prev) => ({ ...prev, companyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No company</SelectItem>
                    {companyList.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={userForm.isAdmin}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, isAdmin: event.target.checked }))
                      }
                      className="h-4 w-4 accent-amber-400"
                    />
                    Admin
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={userForm.isOrganiser}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, isOrganiser: event.target.checked }))
                      }
                      className="h-4 w-4 accent-amber-400"
                    />
                    Organiser
                  </label>
                </div>
                <Button
                  className="bg-amber-400 text-amber-950 hover:bg-amber-300"
                  onClick={handleCreateUser}
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between"
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="text-lg font-semibold">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="grid flex-1 gap-3 lg:max-w-3xl lg:grid-cols-[1fr_0.8fr_0.6fr_0.7fr_0.7fr_auto_auto]">
                      <Select
                        value={user.companyId ?? "none"}
                        onValueChange={(value) =>
                          setUsers((prev) =>
                            prev.map((item) =>
                              item.id === user.id
                                ? { ...item, companyId: value === "none" ? undefined : value }
                                : item
                            )
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No company" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No company</SelectItem>
                          {companyList.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-3 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={user.roleAdmin}
                            onChange={(event) =>
                              setUsers((prev) =>
                                prev.map((item) =>
                                  item.id === user.id
                                    ? { ...item, roleAdmin: event.target.checked }
                                    : item
                                )
                              )
                            }
                            className="h-4 w-4 accent-amber-400"
                          />
                          Admin
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={user.roleOrganiser}
                            onChange={(event) =>
                              setUsers((prev) =>
                                prev.map((item) =>
                                  item.id === user.id
                                    ? { ...item, roleOrganiser: event.target.checked }
                                    : item
                                )
                              )
                            }
                            className="h-4 w-4 accent-amber-400"
                          />
                          Organiser
                        </label>
                      </div>
                      <Input
                        value={user.credits.toString()}
                        onChange={(event) =>
                          setUsers((prev) =>
                            prev.map((item) =>
                              item.id === user.id
                                ? { ...item, credits: Number(event.target.value) }
                                : item
                            )
                          )
                        }
                        placeholder="Credits"
                        type="number"
                      />
                      <Input placeholder="Add credits" type="number" />
                      <Input placeholder="New password" type="password" />
                      <Button
                        className="bg-amber-400 text-amber-950 hover:bg-amber-300"
                        onClick={() => triggerToast("User updated.")}
                      >
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() => setCreditHistoryOpen(user.id)}
                      >
                        Credit history
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <RecentActivityDialog
          open={activityOpen}
          onOpenChange={setActivityOpen}
          entries={activityEntries}
        />

        <RecentActivityDialog
          open={Boolean(creditHistoryOpen)}
          onOpenChange={(open) => setCreditHistoryOpen(open ? creditHistoryOpen : null)}
          entries={creditHistoryEntries}
          title="Credit history"
          description="Recent credit adjustments for this user."
        />

        {toast ? (
          <div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-white px-4 py-2 text-sm shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </AdminGate>
  );
}

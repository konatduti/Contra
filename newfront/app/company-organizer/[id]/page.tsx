"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Trash2 } from "lucide-react";

import { AdminGate } from "@/components/auth/AdminGate";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { companyMembers, companies } from "@/lib/mock-admin";

const roleOptions = ["All roles", "Owner", "Company organiser", "Member", "Admin"];

export default function CompanyOrganizerPage() {
  const params = useParams();
  const companyId = typeof params?.id === "string" ? params.id : "contra-tech";
  const company = companies.find((item) => item.id === companyId) ?? companies[0];

  const [seatLimit, setSeatLimit] = useState(company.seats.toString());
  const [monthlyCredits, setMonthlyCredits] = useState(company.monthlyCredits.toString());
  const [oneOffCredits, setOneOffCredits] = useState(company.oneOffCredits.toString());
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [toast, setToast] = useState<string | null>(null);
  const [members, setMembers] = useState(() =>
    companyMembers.filter((member) => member.companyId === company.id)
  );

  const [newMember, setNewMember] = useState({
    username: "",
    email: "",
    password: "",
    role: "Company organiser"
  });

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All roles" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, roleFilter, searchTerm]);

  const triggerToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleMemberCreditChange = (
    memberId: string,
    field: "monthlyCredits" | "oneOffCredits",
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              [field]: Number(value)
            }
          : member
      )
    );
  };

  const handleAddMember = () => {
    if (!newMember.username || !newMember.email || !newMember.password) {
      triggerToast("Fill in username, email, and password before adding.");
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        id: `member-${Date.now()}`,
        companyId: company.id,
        username: newMember.username,
        email: newMember.email,
        role: newMember.role as "Company organiser",
        monthlyCredits: 0,
        oneOffCredits: 0
      }
    ]);
    setNewMember({ username: "", email: "", password: "", role: "Company organiser" });
    triggerToast("Member added successfully.");
  };

  return (
    <AdminGate>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <TopBar title="Company Dashboard" />
        <div className="flex flex-1 min-h-0 flex-col gap-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Company settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                <Input
                  value={seatLimit}
                  onChange={(event) => setSeatLimit(event.target.value)}
                  placeholder="Seat limit"
                  type="number"
                />
                <Input
                  value={monthlyCredits}
                  onChange={(event) => setMonthlyCredits(event.target.value)}
                  placeholder="Monthly credits"
                  type="number"
                />
                <Input
                  value={oneOffCredits}
                  onChange={(event) => setOneOffCredits(event.target.value)}
                  placeholder="One-off credits"
                  type="number"
                />
                <Button
                  className="bg-amber-400 text-amber-950 hover:bg-amber-300"
                  onClick={() => triggerToast("Company settings updated.")}
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search members"
                  className="min-w-[220px]"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Monthly</TableHead>
                      <TableHead>One-off</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.username}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <Input
                            value={member.monthlyCredits.toString()}
                            onChange={(event) =>
                              handleMemberCreditChange(member.id, "monthlyCredits", event.target.value)
                            }
                            type="number"
                            className="w-[110px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={member.oneOffCredits.toString()}
                            onChange={(event) =>
                              handleMemberCreditChange(member.id, "oneOffCredits", event.target.value)
                            }
                            type="number"
                            className="w-[110px]"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => triggerToast("Password reset sent.")}
                            >
                              New password
                            </Button>
                            <Button
                              variant="outline"
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              onClick={() => triggerToast("Member credits saved.")}
                            >
                              Save
                            </Button>
                            {member.role !== "Owner" && (
                              <Button
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setMembers((prev) => prev.filter((item) => item.id !== member.id))
                                }
                              >
                                Remove
                              </Button>
                            )}
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
              <CardTitle>Add member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_1fr_1fr_auto]">
                <Input
                  value={newMember.username}
                  onChange={(event) => setNewMember((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="Username"
                />
                <Input
                  value={newMember.email}
                  onChange={(event) => setNewMember((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                />
                <Input
                  value={newMember.password}
                  onChange={(event) => setNewMember((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                  type="password"
                />
                <Select
                  value={newMember.role}
                  onValueChange={(value) => setNewMember((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Company organiser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Company organiser">Company organiser</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="bg-amber-400 text-amber-950 hover:bg-amber-300"
                  onClick={handleAddMember}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-red-500 text-white hover:bg-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete company
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete company</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the company and remove
                      all associated members.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button variant="outline">Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => triggerToast("Company deletion requested.")}
                      >
                        Confirm delete
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
        {toast ? (
          <div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-white px-4 py-2 text-sm shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </AdminGate>
  );
}

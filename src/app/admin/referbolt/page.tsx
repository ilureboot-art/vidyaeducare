
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, IndianRupee } from "lucide-react";

// Mock data for ReferBolt management
const initialReferrals = [
  { id: "REF001", referrer: "Alice", new_user: "David", date: "2024-07-29", commission: 50, status: "Paid" },
  { id: "REF002", referrer: "Bob", new_user: "Eve", date: "2024-07-29", commission: 50, status: "Paid" },
  { id: "REF003", referrer: "Charlie", new_user: "Frank", date: "2024-07-28", commission: 0, status: "Pending Subscription" },
  { id: "REF004", referrer: "Alice", new_user: "Grace", date: "2024-07-28", commission: 50, status: "Paid" },
  { id: "REF005", referrer: "David", new_user: "Heidi", date: "2024-07-27", commission: 50, status: "Paid" },
];

const initialStats = {
  totalCycles: 152,
  totalCommissions: 7600,
  activeReferrers: 89,
};

export default function ReferBoltManagementPage() {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [stats, setStats] = useState(initialStats);

  // In a real app, this data would be fetched and updated dynamically
  // For simulation, we can just display the state.

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ReferBolt Management</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referral Cycles
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCycles}</div>
            <p className="text-xs text-muted-foreground">
              +15 since last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commissions Paid
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalCommissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +₹1,500 this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReferrers}</div>
            <p className="text-xs text-muted-foreground">
              +12 new this month
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Referral Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>New User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-medium">{referral.referrer}</TableCell>
                  <TableCell>{referral.new_user}</TableCell>
                  <TableCell>{referral.date}</TableCell>
                  <TableCell>₹{referral.commission}</TableCell>
                  <TableCell>
                    <Badge variant={referral.status === "Paid" ? "default" : "secondary"}>
                      {referral.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, IndianRupee, Repeat } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

type Cycle = {
  id: string;
  referrer: string;
  referrals: number;
  status: "Completed" | "In Progress";
  subscriptionType: "Manual" | "Auto-Renewed";
}

const initialCycles: Cycle[] = [
  { id: "CYCLE01", referrer: "Alice", referrals: 3, status: "Completed", subscriptionType: "Manual" },
  { id: "CYCLE02", referrer: "Bob", referrals: 2, status: "In Progress", subscriptionType: "Manual" },
  { id: "CYCLE03", referrer: "David", referrals: 1, status: "In Progress", subscriptionType: "Manual" },
  { id: "CYCLE04", referrer: "Mallory", referrals: 3, status: "Completed", subscriptionType: "Auto-Renewed" },
]

export default function ReferBoltManagementPage() {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [stats, setStats] = useState(initialStats);
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);

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
          <CardTitle>Referral Cycle Status</CardTitle>
          <CardDescription>Track the progress of active referral cycles (3 referrals per cycle).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead className="w-[200px]">Cycle Progress</TableHead>
                <TableHead className="text-center">Total Referrals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">{cycle.referrer}</TableCell>
                  <TableCell>
                    <Progress value={(cycle.referrals / 3) * 100} className="w-full" />
                  </TableCell>
                  <TableCell className="text-center">{cycle.referrals} / 3</TableCell>
                  <TableCell>
                    <Badge variant={cycle.status === "Completed" ? "default" : "secondary"}>
                      {cycle.status}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    {cycle.subscriptionType === "Auto-Renewed" ? (
                      <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                        <Repeat className="h-3 w-3 text-primary"/>
                        {cycle.subscriptionType}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{cycle.subscriptionType}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                    <Badge variant={referral.status === "Paid" ? "default" : "destructive"}>
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

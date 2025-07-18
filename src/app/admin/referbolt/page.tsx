
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, IndianRupee, Repeat } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// In a real app, this data would be fetched from a database
const initialStats = {
  totalCycles: 5,
  totalCommissions: 12500,
  activeReferrers: 32,
};

type Cycle = {
  id: string;
  referrer: string;
  referrals: number;
  status: "Completed" | "In Progress";
  subscriptionType: "Manual" | "Auto-Renewed";
}

const initialCycles: Cycle[] = [
    { id: 'C001', referrer: 'UserA', referrals: 3, status: 'Completed', subscriptionType: 'Auto-Renewed' },
    { id: 'C002', referrer: 'UserB', referrals: 2, status: 'In Progress', subscriptionType: 'Manual' },
    { id: 'C003', referrer: 'UserC', referrals: 1, status: 'In Progress', subscriptionType: 'Manual' },
    { id: 'C004', referrer: 'UserD', referrals: 3, status: 'Completed', subscriptionType: 'Manual' },
    { id: 'C005', referrer: 'UserA', referrals: 1, status: 'In Progress', subscriptionType: 'Auto-Renewed' },
];

const initialReferralActivity = [
    { id: 1, referrer: 'UserB', newUser: 'NewUser1', date: '2024-08-01', commission: '₹50', status: 'Credited' },
    { id: 2, referrer: 'UserC', newUser: 'NewUser2', date: '2024-07-31', commission: '₹50', status: 'Credited' },
    { id: 3, referrer: 'UserA', newUser: 'NewUser3', date: '2024-07-30', commission: '₹50', status: 'Credited' },
]

export default function ReferBoltManagementPage() {
  const [stats, setStats] = useState(initialStats);
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [referrals, setReferrals] = useState(initialReferralActivity);

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
              +2 from last month
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
              Via ReferBolt program
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
              Currently in a cycle
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
              {cycles.length > 0 ? cycles.map((cycle) => (
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
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No active cycles.</TableCell>
                </TableRow>
              )}
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
                {referrals.length > 0 ? referrals.map((ref) => (
                     <TableRow key={ref.id}>
                        <TableCell className="font-medium">{ref.referrer}</TableCell>
                        <TableCell>{ref.newUser}</TableCell>
                        <TableCell>{ref.date}</TableCell>
                        <TableCell>{ref.commission}</TableCell>
                        <TableCell><Badge>{ref.status}</Badge></TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No referral activity yet.</TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

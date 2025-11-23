
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, IndianRupee, Repeat, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useFirebase } from "@/firebase/client-provider";
import { collection, getDocs, query, Timestamp, type Firestore, getCountFromServer } from "firebase/firestore";

type Cycle = {
  id: string;
  referrer: string;
  referrals: number;
  status: "Completed" | "In Progress";
  subscriptionType: "Manual" | "Auto-Renewed";
}

type Stats = {
  totalCycles: number;
  totalCommissions: number;
  activeReferrers: number;
}

type Referral = {
    id: string;
    referrer: string;
    newUser: string;
    date: string;
    commission: string;
    status: string;
}

export default function ReferBoltManagementPage() {
  const { db } = useFirebase();
  const [stats, setStats] = useState<Stats | null>(null);
  const [cycles, setCycles] = useState<Cycle[] | null>(null);
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
        if (!db) return;
        setStats(null); // Show loader
        
        const referboltSnapshot = await getDocs(collection(db, "referbolt"));
        let totalCycles = 0;
        let activeReferrers = 0;

        const cycleList: Cycle[] = referboltSnapshot.docs.map(doc => {
            const data = doc.data();
            totalCycles += (data.cyclesCompleted || 0);
            if (data.isSubscribed) {
              activeReferrers++;
            }
            return {
              id: doc.id,
              referrer: data.userName || `User ${doc.id.substring(0, 5)}`,
              referrals: data.cycleProgress || 0,
              status: (data.cycleProgress || 0) >= 3 ? 'Completed' : 'In Progress',
              subscriptionType: data.autoRenew ? 'Auto-Renewed' : 'Manual',
            };
        });

        // Fetch recent referral activities (more complex, simplified for now)
        const transactionsQuery = query(collection(db, 'transactions'));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        let totalCommissions = 0;
        const referralList: Referral[] = [];

        transactionsSnapshot.forEach(doc => {
            const tx = doc.data();
            if (tx.type === 'Referral Bonus' || tx.type === 'Commission') {
                totalCommissions += tx.amount;
                const date = tx.date instanceof Timestamp ? tx.date.toDate().toISOString() : tx.date;
                referralList.push({
                    id: doc.id,
                    referrer: tx.user,
                    newUser: tx.description.split(' for ')[1] || tx.description.split(' from ')[1] || 'N/A',
                    date: date,
                    commission: `₹${tx.amount}`,
                    status: tx.status
                });
            }
        });
        
        setStats({ totalCycles, totalCommissions, activeReferrers });
        setCycles(cycleList);
        setReferrals(referralList);
    };
    if (db) {
        fetchData();
    }
  }, [db]);

  if (!stats || !cycles || !referrals) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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
              Completed since launch
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
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No active cycles.</TableCell>
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
                {referrals.length > 0 ? referrals.slice(0, 10).map((ref) => (
                     <TableRow key={ref.id}>
                        <TableCell className="font-medium">{ref.referrer}</TableCell>
                        <TableCell>{ref.newUser}</TableCell>
                        <TableCell>{new Date(ref.date).toLocaleDateString()}</TableCell>
                        <TableCell>{ref.commission}</TableCell>
                        <TableCell><Badge>{ref.status}</Badge></TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No referral activity yet.</TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

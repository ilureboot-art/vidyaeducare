"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, IndianRupee, Repeat, Loader2, Search, FilterX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDb } from "@/firebase";
import { collection, getDocs, query, Timestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  const db = useDb();
  const [stats, setStats] = useState<Stats | null>(null);
  const [cycles, setCycles] = useState<Cycle[] | null>(null);
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [cycleStatusFilter, setCycleStatusFilter] = useState("all");
  const [subTypeFilter, setSubTypeFilter] = useState("all");
  
  const fetchData = async () => {
    if (!db) return;
    setIsRefreshing(true);
    
    try {
        const referboltCol = collection(db, "referbolt");
        const referboltSnapshot = await getDocs(referboltCol).catch(async (e) => {
            const permissionError = new FirestorePermissionError({
                path: referboltCol.path,
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        });
        let totalCyclesCount = 0;
        let activeReferrersCount = 0;

        const cycleList: Cycle[] = referboltSnapshot.docs.map(doc => {
            const data = doc.data();
            totalCyclesCount += (data.cyclesCompleted || 0);
            if (data.isSubscribed) {
              activeReferrersCount++;
            }
            return {
              id: doc.id,
              referrer: data.userName || `User ${doc.id.substring(0, 5)}`,
              referrals: data.cycleProgress || 0,
              status: (data.cycleProgress || 0) >= 3 ? 'Completed' : 'In Progress',
              subscriptionType: data.autoRenew ? 'Auto-Renewed' : 'Manual',
            };
        });

        const txCol = collection(db, 'transactions');
        const transactionsSnapshot = await getDocs(txCol).catch(async (e) => {
            const permissionError = new FirestorePermissionError({
                path: txCol.path,
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw e;
        });
        let totalCommissionsCount = 0;
        const referralList: Referral[] = [];

        transactionsSnapshot.forEach(doc => {
            const tx = doc.data();
            if (tx.type === 'Referral Bonus' || tx.type === 'Commission') {
                totalCommissionsCount += tx.amount;
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
        
        setStats({ totalCycles: totalCyclesCount, totalCommissions: totalCommissionsCount, activeReferrers: activeReferrersCount });
        setCycles(cycleList);
        setReferrals(referralList);
    } catch (error) {
        console.error("ReferBolt Sync Error:", error);
        if (!stats) setStats({ totalCycles: 0, totalCommissions: 0, activeReferrers: 0 });
        if (!cycles) setCycles([]);
        if (!referrals) setReferrals([]);
    } finally {
        setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (db) fetchData();
  }, [db]);

  const filteredCycles = useMemo(() => {
    if (!cycles) return [];
    return cycles.filter(c => {
      const matchesSearch = c.referrer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = cycleStatusFilter === "all" || c.status === cycleStatusFilter;
      const matchesType = subTypeFilter === "all" || c.subscriptionType === subTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [cycles, searchTerm, cycleStatusFilter, subTypeFilter]);

  const filteredReferrals = useMemo(() => {
    if (!referrals) return [];
    return referrals.filter(r => 
      r.referrer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.newUser.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [referrals, searchTerm]);

  const resetFilters = () => {
    setSearchTerm("");
    setCycleStatusFilter("all");
    setSubTypeFilter("all");
  };

  if (stats === null || cycles === null || referrals === null) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ReferBolt Management</h1>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Referral Cycle Status</CardTitle>
              <CardDescription>Track the progress of active referral cycles (3 referrals per cycle).</CardDescription>
            </div>
          </div>
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search referrer..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={cycleStatusFilter} onValueChange={setCycleStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subTypeFilter} onValueChange={setSubTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Subscription Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Auto-Renewed">Auto-Renewed</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" className="text-muted-foreground" onClick={resetFilters}>
              <FilterX className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
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
              {filteredCycles.length > 0 ? filteredCycles.map((cycle) => (
                <TableRow key={cycle.id} className="even:bg-muted/40 transition-colors group">
                  <TableCell className="font-medium">{cycle.referrer}</TableCell>
                  <TableCell>
                    <Progress value={(cycle.referrals / 3) * 100} className="h-2 w-full" />
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No cycles match your filters.</TableCell>
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
                {filteredReferrals.length > 0 ? filteredReferrals.slice(0, 10).map((ref) => (
                     <TableRow key={ref.id} className="even:bg-muted/40 transition-colors group">
                        <TableCell className="font-medium">{ref.referrer}</TableCell>
                        <TableCell>{ref.newUser}</TableCell>
                        <TableCell>{new Date(ref.date).toLocaleDateString()}</TableCell>
                        <TableCell>{ref.commission}</TableCell>
                        <TableCell><Badge>{ref.status}</Badge></TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No matching referral activity found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
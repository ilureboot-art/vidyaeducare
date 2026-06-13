"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Bar, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { Users, IndianRupee, Loader2, AlertCircle, RefreshCcw, BookOpen, TrendingUp, Calendar } from "lucide-react";
import { useDb, useAuth } from "@/firebase";
import { collection, getDocs, query, where, Timestamp, getCountFromServer, orderBy } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes

export default function AnalyticsPage() {
  const db = useDb();
  const { user, isResolved, isAdmin } = useAuth();
  
  // Overall Stats
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [todaysRevenue, setTodaysRevenue] = useState<number | null>(null);
  const [testVolume, setTestVolume] = useState<number | null>(null);
  
  // Raw Data for processing
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async (isManualRefresh = false) => {
      if (!db || !user || !isResolved || !isAdmin) return;
      
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      try {
          const thirtyDaysAgo = subDays(new Date(), 30);
          const thirtyDaysTimestamp = Timestamp.fromDate(thirtyDaysAgo);
          const today = startOfDay(new Date());
          const todayTimestamp = Timestamp.fromDate(today);

          const transactionsCol = collection(db, 'transactions');
          const usersCol = collection(db, 'users');
          const resultsCol = collection(db, 'testResults');

          // Queries for charts (Last 30 days)
          const recentUsersQuery = query(usersCol, where('joinDate', '>=', thirtyDaysAgo.toISOString()));
          const recentTxQuery = query(transactionsCol, where('date', '>=', thirtyDaysTimestamp), where('status', '==', 'Completed'));
          
          // Query for today's specific revenue
          const todayRevenueQuery = query(
            transactionsCol, 
            where('date', '>=', todayTimestamp), 
            where('status', '==', 'Completed')
          );

          const results = await Promise.allSettled([
              getDocs(todayRevenueQuery),
              getCountFromServer(usersCol),
              getCountFromServer(resultsCol),
              getDocs(recentUsersQuery),
              getDocs(recentTxQuery)
          ]);

          // Handle Permission Errors
          results.forEach((res, index) => {
              if (res.status === 'rejected' && (res.reason?.code === 'permission-denied' || res.reason?.message?.includes('permissions'))) {
                  const paths = ['transactions', 'users', 'testResults', 'users', 'transactions'];
                  errorEmitter.emit('permission-error', new FirestorePermissionError({ path: paths[index], operation: 'list' }));
              }
          });

          // Process Total Stats
          if (results[0].status === 'fulfilled') {
              let todayRev = 0;
              results[0].value.forEach(doc => {
                  const data = doc.data();
                  if (data.amount > 0) todayRev += data.amount;
              });
              setTodaysRevenue(todayRev);
          }

          if (results[1].status === 'fulfilled') setActiveUsers(results[1].value.data().count);
          if (results[2].status === 'fulfilled') setTestVolume(results[2].value.data().count);

          // Store Raw Data for useMemo charts
          if (results[3].status === 'fulfilled') {
              setRecentUsers(results[3].value.docs.map(d => d.data()));
          }
          if (results[4].status === 'fulfilled') {
              setRecentTransactions(results[4].value.docs.map(d => d.data()));
          }

      } catch (err: any) {
          console.error("Dashboard Sync Error:", err);
          setError(err.message || "Failed to sync real-time analytics.");
      } finally {
          setLoading(false);
          setRefreshing(false);
      }
  }, [db, user, isResolved, isAdmin]);

  useEffect(() => {
    if(db && user && isResolved && isAdmin) {
        fetchData();
        const refreshTimer = setInterval(() => fetchData(true), AUTO_REFRESH_INTERVAL);
        return () => clearInterval(refreshTimer);
    } else if (isResolved && !isAdmin) {
        setLoading(false);
    }
  }, [db, user, isResolved, isAdmin, fetchData]);

  // Data bucket processing
  const timeSeriesData = useMemo(() => {
      const dates = eachDayOfInterval({
          start: subDays(new Date(), 29),
          end: new Date()
      });

      return dates.map(date => {
          const dateStrStr = date.toISOString().split('T')[0];
          const dateLabel = format(date, 'MMM dd');

          // Signups count
          const signups = recentUsers.filter(u => (u.joinDate || '').startsWith(dateStrStr)).length;

          // Revenue count
          const dayRevenue = recentTransactions
            .filter(tx => {
                const txDate = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date);
                return format(txDate, 'yyyy-MM-dd') === dateStrStr && tx.amount > 0;
            })
            .reduce((sum, tx) => sum + tx.amount, 0);

          return {
              name: dateLabel,
              signups,
              revenue: dayRevenue
          };
      });
  }, [recentUsers, recentTransactions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Populating Intelligence Hub...</p>
      </div>
    );
  }

  if (!isAdmin) {
      return (
          <div className="flex justify-center items-center h-96">
              <Card className="max-w-md w-full border-primary/20"><CardHeader><CardTitle>Admin Level Required</CardTitle><CardDescription>Only administrators can view system-wide analytics.</CardDescription></CardHeader></Card>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary uppercase italic">Analytics Terminal</h1>
            <p className="text-muted-foreground text-sm font-medium">Growth trajectory and financial performance metrics.</p>
        </div>
        <Button variant="outline" size="sm" className="font-bold rounded-xl shadow-sm" onClick={() => fetchData(true)} disabled={refreshing}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          RE-SYNC TERMINAL
        </Button>
      </div>

      {error && (
          <Alert variant="destructive" className="bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Network Synchronization Delay</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      {/* High-Level KPIs */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow border-primary/10 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="pb-2 bg-primary/5">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4 text-primary"/> Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-4xl font-black tracking-tighter">{activeUsers !== null ? activeUsers.toLocaleString() : '...'}</p>
            <p className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-tight">Across All Boards</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-primary/10 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="pb-2 bg-primary/5">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary"/> MockArena Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-4xl font-black tracking-tighter">{testVolume !== null ? testVolume.toLocaleString() : '...'}</p>
            <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tight">Active Learning Pulse</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/[0.02] rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="pb-2 bg-primary/10">
            <CardTitle className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary"/> Revenue Log (Today)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-4xl font-black text-primary tracking-tighter">{todaysRevenue !== null ? formatCurrency(todaysRevenue) : '...'}</p>
            <p className="text-[10px] font-black text-primary/50 mt-1 uppercase tracking-tight italic">Live Liquidity</p>
          </CardContent>
        </Card>
      </div>

      {/* 30-Day Detailed Charts */}
      <div className="grid gap-6 lg:grid-cols-1">
        <Card className="border-primary/10 rounded-[2rem] shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4 border-b flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg font-black uppercase italic text-primary">Student Acquisition</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest">New Intake (Last 30 Days)</CardDescription>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl">
                <TrendingUp className="text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                    <defs>
                        <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis 
                        dataKey="name" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        minTickGap={30}
                        tick={{ fontWeight: 'bold' }}
                    />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="signups" 
                        name="New Signups"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorSignups)" 
                        animationDuration={1500}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t justify-center py-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                <Calendar size={12}/> Daily Enrollment Log
              </p>
          </CardFooter>
        </Card>

        <Card className="border-accent/10 rounded-[2rem] shadow-xl overflow-hidden">
          <CardHeader className="bg-accent/5 pb-4 border-b flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg font-black uppercase italic text-accent">Revenue performance</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest">Gross Inflow (Last 30 Days)</CardDescription>
            </div>
            <div className="p-3 bg-accent/10 rounded-2xl">
                <IndianRupee className="text-accent" />
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis 
                            dataKey="name" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            minTickGap={30}
                            tick={{ fontWeight: 'bold' }}
                        />
                        <YAxis 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{ fontWeight: 'bold' }}
                            tickFormatter={(val) => `₹${val}`}
                        />
                        <Tooltip 
                            formatter={(val: number) => [formatCurrency(val), "Revenue"]}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                        />
                        <Bar 
                            dataKey="revenue" 
                            fill="hsl(var(--accent))" 
                            radius={[6, 6, 0, 0]} 
                            animationDuration={1500}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
           <CardFooter className="bg-muted/30 border-t justify-center py-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                <IndianRupee size={12}/> Audited Growth Stream
              </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
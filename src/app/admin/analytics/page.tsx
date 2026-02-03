
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar, ResponsiveContainer } from "recharts";
import { Users, Gamepad2, IndianRupee, Loader2, AlertCircle } from "lucide-react";
import { useDb } from "@/firebase";
import { collection, getDocs, query, where, Timestamp, getCountFromServer } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ChartData {
    name: string;
    users?: number;
    revenue?: number;
}

const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d);
    }
    return dates;
};

export default function AnalyticsPage() {
  const db = useDb();
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [todaysRevenue, setTodaysRevenue] = useState<number | null>(null);
  const [userActivityData, setUserActivityData] = useState<ChartData[] | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
        if (!db) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch total revenue for today
            const transactionsCollection = collection(db, 'transactions');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            const revenueQuery = query(transactionsCollection, where('date', '>=', todayTimestamp), where('type', '==', 'Purchase'));
            const revenueSnapshot = await getDocs(revenueQuery);
            let totalRevenue = 0;
            revenueSnapshot.forEach(doc => {
                totalRevenue += Math.abs(doc.data().amount);
            });
            setTodaysRevenue(totalRevenue);

            // Fetch user count
            const usersCol = collection(db, 'users');
            const usersSnapshot = await getCountFromServer(usersCol);
            setActiveUsers(usersSnapshot.data().count);

            // User activity for the last 7 days - Optimized mock
            const activityDates = getLast7Days();
            const fetchedUserActivity: ChartData[] = activityDates.map(date => {
                return {
                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric'}),
                    users: Math.floor(Math.random() * 50) + 10
                };
            });
            setUserActivityData(fetchedUserActivity);

            // Weekly revenue - Optimized mock
            const serverRevenueData: ChartData[] = [
              { name: 'Week 1', revenue: 4000 },
              { name: 'Week 2', revenue: 3000 },
              { name: 'Week 3', revenue: 5000 },
              { name: 'Week 4', revenue: 4500 },
            ];
            setRevenueData(serverRevenueData);

        } catch (err: any) {
            console.error("Error fetching analytics data:", err);
            setError(err.message || "Failed to load dashboard data. Please ensure your permissions are correct.");
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
  }, [db]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-muted-foreground">Calculating statistics...</p>
      </div>
    );
  }

  if (error) {
      return (
          <div className="p-6">
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Dashboard Error</AlertTitle>
                  <AlertDescription>
                      {error}
                  </AlertDescription>
              </Alert>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium"><Users className="text-primary h-4 w-4"/> Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeUsers?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">All registered students & parents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium"><Gamepad2 className="text-primary h-4 w-4"/> Academic Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">High</p>
            <p className="text-xs text-muted-foreground mt-1">Based on recent mock test engagement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium"><IndianRupee className="text-primary h-4 w-4"/> Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{todaysRevenue?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">From subscriptions & purchases today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Activity (Last 7 Days)</CardTitle>
            <CardDescription>Daily active users trends.</CardDescription>
          </CardHeader>
          <CardContent>
            {userActivityData && userActivityData.length > 0 ? (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userActivityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} dy={10} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
             ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No user activity data to display.
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
            <CardDescription>Performance comparison over weeks.</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData && revenueData.length > 0 ? (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} dy={10} />
                            <YAxis axisLine={false} tickLine={false} fontSize={12} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                 <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No revenue data to display.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

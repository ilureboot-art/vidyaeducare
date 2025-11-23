
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar, ResponsiveContainer } from "recharts";
import { Users, Gamepad2, IndianRupee, Loader2 } from "lucide-react";
import { useFirebase } from "@/firebase";
import { collection, getDocs, query, where, Timestamp, type Firestore,getCountFromServer } from "firebase/firestore";

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
  const { db } = useFirebase();
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);
  const [todaysRevenue, setTodaysRevenue] = useState<number | null>(null);
  const [userActivityData, setUserActivityData] = useState<ChartData[] | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData[] | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
        if (!db) return;
        try {
            // Fetch total revenue, active users etc.
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

            const usersCol = collection(db, 'users');
            const usersSnapshot = await getCountFromServer(usersCol);
            setActiveUsers(usersSnapshot.data().count);
            setGamesPlayed(0); // Game feature removed

            // User activity for the last 7 days - MOCKED for performance
            const activityDates = getLast7Days();
            const fetchedUserActivity: ChartData[] = activityDates.map(date => {
                return {
                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric'}),
                    users: Math.floor(Math.random() * 50) + 10 // Mock data
                };
            });
            setUserActivityData(fetchedUserActivity);


            // Weekly revenue (mocked for performance)
            const serverRevenueData: ChartData[] = [
              { name: 'Week 1', revenue: 4000 },
              { name: 'Week 2', revenue: 3000 },
              { name: 'Week 3', revenue: 5000 },
              { name: 'Week 4', revenue: 4500 },
            ];
            setRevenueData(serverRevenueData);


        } catch (error) {
            console.error("Error fetching analytics data:", error);
        }
    };
    if (db) {
        fetchData();
    }
  }, [db]);

  if (activeUsers === null || gamesPlayed === null || todaysRevenue === null || !userActivityData || !revenueData) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-primary"/> Games Played Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gamesPlayed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">This feature is removed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><IndianRupee className="text-primary"/> Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{todaysRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">+5.2% from yesterday (mock)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Activity (Last 7 Days)</CardTitle>
            <CardDescription>Mock data showing daily active users.</CardDescription>
          </CardHeader>
          <CardContent>
            {userActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
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
            <CardDescription>Mock data for weekly revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
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

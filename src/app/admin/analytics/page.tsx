
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar, ResponsiveContainer } from "recharts";
import { Users, Gamepad2, IndianRupee, Loader2 } from "lucide-react";

// In a real app, this data would be fetched from a server
const userActivityData = [
  { name: 'Jul 22', users: 120 },
  { name: 'Jul 23', users: 150 },
  { name: 'Jul 24', users: 175 },
  { name: 'Jul 25', users: 160 },
  { name: 'Jul 26', users: 190 },
  { name: 'Jul 27', users: 210 },
  { name: 'Jul 28', users: 230 },
];

const revenueData = [
  { name: 'Week 1', revenue: 4000 },
  { name: 'Week 2', revenue: 3000 },
  { name: 'Week 3', revenue: 5000 },
  { name: 'Week 4', revenue: 4500 },
];

export default function AnalyticsPage() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [todaysRevenue, setTodaysRevenue] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real app, this data would be fetched and updated
    setActiveUsers(230);
    setGamesPlayed(1450);
    setTodaysRevenue(5230);
  }, []);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> Daily Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">+9.5% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-primary"/> Games Played Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gamesPlayed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><IndianRupee className="text-primary"/> Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{todaysRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">+5.2% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Activity (Last 7 Days)</CardTitle>
            <CardDescription>Tracks the number of active users daily.</CardDescription>
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
            <CardDescription>Tracks revenue generated from ticket sales and other sources.</CardDescription>
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

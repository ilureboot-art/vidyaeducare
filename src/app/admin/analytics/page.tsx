
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar, ResponsiveContainer } from "recharts";
import { Users, Gamepad2, IndianRupee } from "lucide-react";

// In a real app, this data would be fetched from a server
const userActivityData: any[] = [];

const revenueData: any[] = [];

export default function AnalyticsPage() {
  // In a real app, this data would be fetched and updated
  const [activeUsers] = useState(0);
  const [gamesPlayed] = useState(0);
  const [todaysRevenue] = useState(0);

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
            <p className="text-xs text-muted-foreground">No data yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-primary"/> Games Played Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gamesPlayed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">No data yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><IndianRupee className="text-primary"/> Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{todaysRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">No data yet</p>
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

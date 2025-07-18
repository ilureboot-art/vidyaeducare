
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trophy, Users, BarChart2, Star, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const studentStats = {
    name: "Alex Doe",
    testsTaken: 4,
    avgScore: 75,
    badges: ["Gold", "Silver"],
    performance: [
        { subject: "Maths", score: 82 },
        { subject: "Science", score: 68 },
        { subject: "English", score: 78 },
        { subject: "History", score: 71 },
    ],
};

const quickLinks = [
    { href: "/mock-test", label: "Take a Mock Test", icon: BookOpen },
    { href: "/leaderboard", label: "View Leaderboard", icon: Trophy },
    { href: "/profile", label: "Manage Student Profiles", icon: Users },
];


export default function StudentDashboardPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    
    // Simulate upcoming test dates
    const testDates = [
        new Date(new Date().setDate(new Date().getDate() + 5)),
        new Date(new Date().setDate(new Date().getDate() + 12)),
    ];
    
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile avatar" />
                    <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {studentStats.name}!</h1>
                    <p className="text-muted-foreground">Ready to ace your next test?</p>
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests Taken</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{studentStats.testsTaken}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold">{studentStats.avgScore}%</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Badges Earned</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <div className="flex items-center gap-2">
                            {studentStats.badges.length > 0 ? studentStats.badges.map(badge => (
                                <div key={badge} className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-6 h-6"/>
                                    <span className="font-semibold text-lg">{badge}</span>
                                </div>
                            )) : <p className="text-sm">No badges yet</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart2/> Performance Dashboard</CardTitle>
                    <CardDescription>Your average scores across different subjects.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={studentStats.performance}>
                            <XAxis dataKey="subject" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`}/>
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

             <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarIcon /> Mock Test Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                         <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            modifiers={{ scheduled: testDates }}
                            modifiersClassNames={{
                                scheduled: "bg-primary/20 text-primary-foreground rounded-full",
                            }}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {quickLinks.map(link => (
                            <Link href={link.href} key={link.href} className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
                                <div className="flex items-center gap-3 font-medium">
                                    <link.icon className="w-5 h-5 text-primary" />
                                    <span>{link.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>


            <Card className="text-center">
                 <CardHeader>
                    <CardTitle>Ready to Study?</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button asChild size="lg">
                        <Link href="/mock-test">Start a New Mock Test</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

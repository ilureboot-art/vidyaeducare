
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trophy, Users, BarChart2, Star, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";

const studentStats = {
    name: "Alex Doe",
    testsTaken: 0,
    avgScore: 0,
    badges: ["Gold", "Silver"],
};

const quickLinks = [
    { href: "/mock-test", label: "Take a Mock Test", icon: BookOpen },
    { href: "/leaderboard", label: "View Leaderboard", icon: Trophy },
    { href: "/profile", label: "Manage Student Profiles", icon: Users },
    { href: "/transactions", label: "View Performance", icon: BarChart2 },
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
            
            <div className="grid md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Your Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Tests Taken</p>
                            <p className="text-2xl font-bold">{studentStats.testsTaken}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Average Score</p>
                            <p className="text-2xl font-bold">{studentStats.avgScore}%</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                            <p className="text-xs text-muted-foreground">Badges</p>
                            <div className="flex justify-center gap-2 mt-1">
                                {studentStats.badges.length > 0 ? studentStats.badges.map(badge => (
                                    <div key={badge} className="flex items-center gap-1 text-yellow-500">
                                        <Star className="w-5 h-5"/>
                                        <span className="font-semibold text-sm">{badge}</span>
                                    </div>
                                )) : <p className="text-sm">No badges yet</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
            </div>


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

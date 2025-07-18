
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, TrendingUp, Gamepad2, Percent, Edit, Fingerprint, GraduationCap, Building, Languages, BookCopy, FileClock, Cake, Medal, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { studentData } from "@/lib/student-data";
import type { StudentProfile } from "@/lib/student-data";

function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  if (!formattedDate) {
    return null; // Or a loading skeleton
  }

  return <>{formattedDate}</>;
}


export default function ProfilePage() {
    const [student, setStudent] = useState<StudentProfile>(studentData[0]);

    if (!student) {
        return <div>Loading profile...</div>
    }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
       <Card className="shadow-lg">
            <CardHeader>
            <div className="flex items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="profile avatar" />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-primary flex items-center justify-between">
                        <span>{student.name}</span>
                        <Button variant="outline" size="sm"><Edit className="mr-2"/> Edit Profile</Button>
                    </CardTitle>
                    <CardDescription>Student ID: {student.id}</CardDescription>
                </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-6">
            
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><GraduationCap/> Academic Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <Cake className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">D.O.B</span>
                                <span><FormattedDate dateString={student.dob} /></span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <GraduationCap className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Standard</span>
                                <span>{student.academic.standard}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <Building className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Board</span>
                                <span>{student.academic.board}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <FileClock className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Year</span>
                                <span>{student.academic.academicYear}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <Languages className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Language</span>
                                <span>{student.academic.language}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Stream</span>
                                <span>{student.academic.stream}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg col-span-2 md:col-span-3">
                            <BookCopy className="w-4 h-4 text-muted-foreground mt-1"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Subjects</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {student.academic.subjects.map(sub => <Badge key={sub} variant="secondary">{sub}</Badge>)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><BarChart2/> Performance Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Percent className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400 mb-1"/>
                            <p className="text-xl font-bold">{student.stats.avgScore}%</p>
                            <p className="text-xs text-muted-foreground">Avg. Score</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <TrendingUp className="w-5 h-5 mx-auto text-green-600 dark:text-green-400 mb-1"/>
                            <p className="text-xl font-bold">₹{student.stats.totalEarnings}</p>
                            <p className="text-xs text-muted-foreground">Earnings</p>
                        </div>
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                            <Gamepad2 className="w-5 h-5 mx-auto text-pink-600 dark:text-pink-400 mb-1"/>
                            <p className="text-xl font-bold">{student.stats.testsTaken}</p>
                            <p className="text-xs text-muted-foreground">Tests Taken</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg col-span-2 md:col-span-3">
                            <Medal className="w-5 h-5 mx-auto text-yellow-600 dark:text-yellow-400 mb-1"/>
                            <p className="text-xs text-muted-foreground mb-2">Badges Earned</p>
                            <div className="flex justify-center gap-2">
                                {student.badges.length > 0 ? student.badges.map(badge => <Badge key={badge} variant="default">{badge}</Badge>) : <p className="text-sm">No badges yet.</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            
            </CardContent>
        </Card>
    </div>
  );
}

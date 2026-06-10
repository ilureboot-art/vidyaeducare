"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FilePlus, Loader2, Clock, Hourglass, Search, FilterX } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ScheduledTest } from "@/lib/test-schedule";
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useDb } from '@/firebase';
import UserLayout from '@/components/UserLayout';
import { type AcademicConfig, defaultAcademicConfig } from "@/lib/academic-config";

type TestStatus = 'Live' | 'Upcoming' | 'Completed';
type ScheduledTestWithStatus = ScheduledTest & { status: TestStatus };

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = differenceInSeconds(target, now);

            if (diff <= 0) {
                setTimeLeft("Starting Now!");
                return;
            }

            const days = Math.floor(diff / (24 * 3600));
            const hours = Math.floor((diff % (24 * 3600)) / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            let timeStr = "";
            if (days > 0) timeStr += `${days}d `;
            if (hours > 0 || days > 0) timeStr += `${hours}h `;
            timeStr += `${minutes}m ${seconds}s`;
            
            setTimeLeft(timeStr);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <Badge variant="outline" className="font-mono bg-accent/5 text-accent border-accent/20 animate-pulse">
            <Hourglass className="w-3 h-3 mr-1.5" />
            {timeLeft}
        </Badge>
    );
}

export default function TestSchedulePage() {
    const db = useDb();
    const [allSchedules, setAllSchedules] = useState<ScheduledTestWithStatus[] | null>(null);
    const [academicConfig, setAcademicConfig] = useState<AcademicConfig>(defaultAcademicConfig);
    
    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [boardFilter, setBoardFilter] = useState<string>("all");
    const [standardFilter, setStandardFilter] = useState<string>("all");
    const [subjectFilter, setSubjectFilter] = useState<string>("all");

    useEffect(() => {
        const fetchSchedules = async () => {
            if (!db) return;
            const schedulesCollection = collection(db, "scheduledTests");
            const scheduleSnapshot = await getDocs(schedulesCollection);
            const scheduleList = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledTest));

            const configRef = doc(db, "configs", 'academic');
            const configSnap = await getDoc(configRef).catch(() => null);
            if (configSnap && configSnap.exists()) {
                setAcademicConfig(configSnap.data() as AcademicConfig);
            }

            if (scheduleList) {
                const now = new Date();
                const updatedSchedules = [...scheduleList]
                    .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                    .map(test => {
                        const testDate = new Date(test.dateTime);
                        let status: TestStatus = 'Upcoming';
                        
                        if (testDate < now) {
                            status = 'Completed';
                        }
    
                        const isToday = format(testDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                        if (isToday && testDate.getHours() <= now.getHours()) {
                           status = 'Live';
                        }
                        
                        return { ...test, status };
                    });
    
                setAllSchedules(updatedSchedules);
            }
        };
        if(db) fetchSchedules();
    }, [db]);

    const filteredSchedules = useMemo(() => {
        if (!allSchedules) return [];
        return allSchedules.filter(test => {
            const matchesSearch = test.testSetName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBoard = boardFilter === "all" || test.board === boardFilter;
            const matchesStandard = standardFilter === "all" || test.standard === standardFilter;
            const matchesSubject = subjectFilter === "all" || test.subject === subjectFilter;
            return matchesSearch && matchesBoard && matchesStandard && matchesSubject;
        });
    }, [allSchedules, searchTerm, boardFilter, standardFilter, subjectFilter]);
    
    if (!allSchedules) {
        return (
          <UserLayout>
              <div className="flex justify-center items-center h-96">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
          </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <CalendarIcon className="text-primary"/> Mock Test Schedule
                </h1>
                
                <Card className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Academic Calendar</CardTitle>
                                <CardDescription>Find and track upcoming live mock tests for your standard.</CardDescription>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSearchTerm(""); setBoardFilter("all"); setStandardFilter("all"); setSubjectFilter("all"); }}
                                className="text-muted-foreground"
                            >
                                <FilterX className="mr-2 h-4 w-4"/> Reset
                            </Button>
                        </div>
                        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by name..." 
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={boardFilter} onValueChange={setBoardFilter}>
                                <SelectTrigger><SelectValue placeholder="Board" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Boards</SelectItem>
                                    {academicConfig.boards.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={standardFilter} onValueChange={setStandardFilter}>
                                <SelectTrigger><SelectValue placeholder="Standard" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Standards</SelectItem>
                                    {academicConfig.standards.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {academicConfig.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test Name</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status / Countdown</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSchedules.length > 0 ? filteredSchedules.map(test => (
                                    <TableRow key={test.id} className={test.status === 'Live' ? 'bg-primary/[0.02]' : ''}>
                                        <TableCell>
                                            <div>
                                                <p className="font-bold text-sm">{test.testSetName}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{test.board} • {test.standard} • {test.subject}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {format(new Date(test.dateTime), "PPP p")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3"/>
                                                {test.duration || 30} mins
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <Badge variant={test.status === 'Live' ? 'default' : test.status === 'Completed' ? 'secondary' : 'outline'} className="w-fit h-5 text-[9px] uppercase tracking-tighter">
                                                    {test.status}
                                                </Badge>
                                                {test.status === 'Upcoming' && (
                                                    <CountdownTimer targetDate={test.dateTime} />
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            {allSchedules.length > 0 ? "No matches found for your filters." : "No tests scheduled yet."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30 border-dashed border-2">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary"><Clock className="w-6 h-6"/></div>
                        <div>
                            <h3 className="font-bold">Automated Timekeeping</h3>
                            <p className="text-sm text-muted-foreground">Tests will automatically lock and submit once the allotted duration expires. Ensure you have a stable internet connection during live sessions.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </UserLayout>
    );
}

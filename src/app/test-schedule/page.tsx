"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FilePlus, Loader2, Clock, Hourglass } from "lucide-react";
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
import type { ScheduledTest } from "@/lib/test-schedule";
import { collection, getDocs } from 'firebase/firestore';
import { useDb } from '@/firebase';
import UserLayout from '@/components/UserLayout';

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
    
    useEffect(() => {
        const fetchSchedules = async () => {
            if (!db) return;
            const schedulesCollection = collection(db, "scheduledTests");
            const scheduleSnapshot = await getDocs(schedulesCollection);
            const scheduleList = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledTest));

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
                        <CardTitle>Academic Calendar</CardTitle>
                        <CardDescription>Track upcoming live mock tests and practice session availability.</CardDescription>
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
                                {allSchedules.length > 0 ? allSchedules.map(test => (
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
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No tests scheduled yet.</TableCell>
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

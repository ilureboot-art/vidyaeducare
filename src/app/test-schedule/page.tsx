
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FilePlus, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
import { db } from '@/lib/firebase';

type TestStatus = 'Live' | 'Upcoming' | 'Completed';
type ScheduledTestWithStatus = ScheduledTest & { status: TestStatus };

export default function TestSchedulePage() {
    const { toast } = useToast();
    
    const [allSchedules, setAllSchedules] = useState<ScheduledTestWithStatus[] | null>(null);

    useEffect(() => {
        const fetchSchedules = async () => {
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
        fetchSchedules();
    }, []);
    
    if (!allSchedules) {
        return (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon /> Mock Test Schedule
            </h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming & Past Tests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Test Name</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allSchedules.length > 0 ? allSchedules.map(test => (
                                <TableRow key={test.id}>
                                    <TableCell>{format(new Date(test.dateTime), "PPP p")}</TableCell>
                                    <TableCell className="font-medium">{test.testSetName}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{`${test.board} / ${test.standard} / ${test.subject}`}</TableCell>
                                    <TableCell>
                                        <Badge variant={test.status === 'Live' ? 'default' : test.status === 'Completed' ? 'secondary' : 'outline'}>
                                            {test.status}
                                        </Badge>
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
        </div>
    );
}

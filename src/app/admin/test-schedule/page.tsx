
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FilePlus, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useAppData, useDataUpdaters } from "@/hooks/use-hydrate-data";
import type { TestSet } from "@/lib/question-bank";
import type { ScheduledTest } from "@/lib/test-schedule";

type TestStatus = 'Live' | 'Upcoming' | 'Completed';

type ScheduledTestWithStatus = ScheduledTest & { status: TestStatus };

export default function TestSchedulePage() {
    const { toast } = useToast();
    const appData = useAppData();
    const { setScheduledTests } = useDataUpdaters();

    const [allSchedules, setAllSchedules] = useState<ScheduledTestWithStatus[] | null>(null);
    const [testSets, setTestSets] = useState<TestSet[] | null>(null);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState('10:00'); // Default time
    const [selectedTestSetId, setSelectedTestSetId] = useState('');
    
    useEffect(() => {
        if (appData) {
            if (appData.scheduledTests) {
                refreshSchedules(appData.scheduledTests);
            }
            if (appData.testSets) {
                setTestSets(appData.testSets);
            }
        }
        setDate(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appData]);
    
    const refreshSchedules = (schedules: ScheduledTest[]) => {
         if (schedules) {
            const now = new Date();
            const updatedSchedules = [...schedules]
                .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                .map(test => {
                    const testDate = new Date(test.dateTime);
                    let status: TestStatus = 'Upcoming';
                    
                    const isToday = format(testDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

                    if (testDate < now) {
                        status = 'Completed';
                    }

                    if (isToday && testDate <= now) {
                       status = 'Live';
                    }
                    
                    return { ...test, status };
                });

            setAllSchedules(updatedSchedules);
         }
    }


    const handleScheduleTest = () => {
        if (!date || !selectedTestSetId || !time || !testSets || !allSchedules) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please select a test set, a date, and a time.",
            });
            return;
        }
        
        const testSet = testSets.find(ts => ts.id === selectedTestSetId);
        if (!testSet) {
             toast({ variant: 'destructive', title: "Error", description: "Selected test set could not be found." });
             return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const combinedDateTime = new Date(date);
        combinedDateTime.setHours(hours, minutes, 0, 0);

        const newTest: ScheduledTest = {
            id: `SCHED-${Date.now()}`,
            testSetId: testSet.id,
            testSetName: testSet.name,
            dateTime: combinedDateTime.toISOString(),
            board: testSet.board,
            standard: testSet.standard,
            subject: testSet.subject,
        };

        setScheduledTests(prev => [...prev, newTest]);

        toast({
            title: "Test Scheduled!",
            description: `"${testSet.name}" has been added to the calendar for ${format(combinedDateTime, "PPP p")}.`
        });
        
        // Reset form
        setSelectedTestSetId('');
        setDate(new Date());
        setTime('10:00');
    };
    
    if (!appData || !allSchedules || !testSets) {
        return (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon /> Mock Test Scheduler
            </h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Schedule a New Mock Test</CardTitle>
                    <CardDescription>
                        Select a pre-defined test set and assign it a date and time on the calendar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="space-y-2">
                            <Label htmlFor="test-set">Test Set</Label>
                            <Select value={selectedTestSetId} onValueChange={setSelectedTestSetId}>
                                <SelectTrigger id="test-set"><SelectValue placeholder="Select a test set..." /></SelectTrigger>
                                <SelectContent>
                                    {testSets.length > 0 ? testSets.map(ts => (
                                        <SelectItem key={ts.id} value={ts.id}>{ts.name} ({ts.board}/{ts.standard})</SelectItem>
                                    )) : (
                                        <SelectItem value="disabled" disabled>No test sets available. Upload one first.</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Test Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="test-time">Test Time</Label>
                             <Input 
                                id="test-time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                             />
                        </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <Button onClick={handleScheduleTest} disabled={!selectedTestSetId || !date || !time}>
                            <FilePlus className="mr-2"/> Schedule Test
                        </Button>
                    </div>
                </CardContent>
            </Card>

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

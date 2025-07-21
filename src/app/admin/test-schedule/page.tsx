
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FilePlus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { academicConfig } from '@/lib/academic-config';
import { allTestSets, type TestSet } from '@/lib/question-bank';
import { scheduledTests, addScheduledTest, type ScheduledTest } from '@/lib/test-schedule';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function TestSchedulePage() {
    const { toast } = useToast();
    const [allSchedules, setAllSchedules] = useState<ScheduledTest[]>(scheduledTests);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedTestSetId, setSelectedTestSetId] = useState('');

    const handleScheduleTest = () => {
        if (!date || !selectedTestSetId) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please select a test set and a date.",
            });
            return;
        }
        
        const testSet = allTestSets.find(ts => ts.id === selectedTestSetId);
        if (!testSet) {
             toast({ variant: 'destructive', title: "Error", description: "Selected test set could not be found." });
             return;
        }

        const newTest: ScheduledTest = {
            id: `SCHED-${Date.now()}`,
            testSetId: testSet.id,
            testSetName: testSet.name,
            date: format(date, "yyyy-MM-dd"),
            board: testSet.board,
            standard: testSet.standard,
            subject: testSet.subject,
        };

        addScheduledTest(newTest);
        setAllSchedules([...scheduledTests]);

        toast({
            title: "Test Scheduled!",
            description: `"${testSet.name}" has been added to the calendar.`
        });
        
        // Reset form
        setSelectedTestSetId('');
        setDate(new Date());
    };
    
    const sortedSchedules = [...allSchedules].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon /> Mock Test Scheduler
            </h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Schedule a New Mock Test</CardTitle>
                    <CardDescription>
                        Select a pre-defined test set and assign it to a date on the calendar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                            <Label htmlFor="test-set">Test Set</Label>
                            <Select value={selectedTestSetId} onValueChange={setSelectedTestSetId}>
                                <SelectTrigger id="test-set"><SelectValue placeholder="Select a test set..." /></SelectTrigger>
                                <SelectContent>
                                    {allTestSets.length > 0 ? allTestSets.map(ts => (
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
                    </div>
                     <div className="flex justify-end pt-4">
                        <Button onClick={handleScheduleTest} disabled={!selectedTestSetId || !date}>
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
                                <TableHead>Date</TableHead>
                                <TableHead>Test Name</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedSchedules.length > 0 ? sortedSchedules.map(test => {
                                const testDate = new Date(test.date);
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                testDate.setHours(0,0,0,0);

                                let status: 'Live' | 'Upcoming' | 'Completed' = 'Upcoming';
                                if (testDate.getTime() < today.getTime()) {
                                    status = 'Completed';
                                } else if (testDate.getTime() === today.getTime()) {
                                    status = 'Live';
                                }

                                return (
                                    <TableRow key={test.id}>
                                        <TableCell>{format(new Date(test.date), "PPP")}</TableCell>
                                        <TableCell className="font-medium">{test.testSetName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{`${test.board} / ${test.standard} / ${test.subject}`}</TableCell>
                                        <TableCell>
                                            <Badge variant={status === 'Live' ? 'default' : status === 'Completed' ? 'secondary' : 'outline'}>
                                                {status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
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

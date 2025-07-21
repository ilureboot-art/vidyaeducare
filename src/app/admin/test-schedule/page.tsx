
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
import { Input } from "@/components/ui/input";
import { academicConfig } from '@/lib/academic-config';
import { allQuestions } from '@/lib/question-bank';
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
    const [board, setBoard] = useState('');
    const [standard, setStandard] = useState('');
    const [subject, setSubject] = useState('');
    const [title, setTitle] = useState('');

    const handleScheduleTest = () => {
        if (!date || !board || !standard || !subject || !title) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please fill out all fields to schedule a test.",
            });
            return;
        }

        const availableQuestions = allQuestions.filter(q =>
            q.board === board && q.standard === standard && q.subject === subject
        );

        if (availableQuestions.length < 50) {
             toast({
                variant: 'destructive',
                title: "Not Enough Questions",
                description: `Found only ${availableQuestions.length} questions for this criteria. At least 50 are required.`,
            });
            return;
        }
        
        // Select 50 random questions
        const selectedQuestionIds = availableQuestions.sort(() => 0.5 - Math.random()).slice(0, 50).map(q => q.id);

        const newTest: ScheduledTest = {
            id: `TEST-${Date.now()}`,
            title,
            date: format(date, "yyyy-MM-dd"),
            board: board as any,
            standard,
            subject,
            questionIds: selectedQuestionIds,
        };

        addScheduledTest(newTest);
        setAllSchedules([...scheduledTests]);

        toast({
            title: "Test Scheduled!",
            description: `${title} for ${subject} has been added to the calendar.`
        });
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
                        Set up a future test. The system will automatically select 50 questions based on your criteria.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <Label htmlFor="board">Board</Label>
                            <Select value={board} onValueChange={setBoard}>
                                <SelectTrigger id="board"><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>{academicConfig.boards.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="standard">Standard</Label>
                             <Select value={standard} onValueChange={setStandard}>
                                <SelectTrigger id="standard"><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>{academicConfig.standards.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                             <Select value={subject} onValueChange={setSubject}>
                                <SelectTrigger id="subject"><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>{academicConfig.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <Label htmlFor="title">Test Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Science Monthly Test #1"/>
                        </div>
                    </div>
                     <div className="flex justify-end pt-4">
                        <Button onClick={handleScheduleTest}>
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
                                <TableHead>Title</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedSchedules.map(test => {
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
                                        <TableCell>{format(testDate, "PPP")}</TableCell>
                                        <TableCell className="font-medium">{test.title}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{`${test.board} / ${test.standard} / ${test.subject}`}</TableCell>
                                        <TableCell>
                                            <Badge variant={status === 'Live' ? 'default' : status === 'Completed' ? 'secondary' : 'outline'}>
                                                {status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

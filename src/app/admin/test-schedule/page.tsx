"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FilePlus, Loader2, AlertCircle, RefreshCcw } from "lucide-react";
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
import { type TestSet } from "@/lib/question-bank";
import { type ScheduledTest } from "@/lib/test-schedule";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useDb } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

type TestStatus = 'Live' | 'Upcoming' | 'Completed';

type ScheduledTestWithStatus = ScheduledTest & { status: TestStatus };

export default function TestSchedulePage() {
    const { toast } = useToast();
    const db = useDb();

    const [allSchedules, setAllSchedules] = useState<ScheduledTestWithStatus[]>([]);
    const [testSets, setTestSets] = useState<TestSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState('10:00'); 
    const [selectedTestSetId, setSelectedTestSetId] = useState('');
    
    const fetchPageData = useCallback(async (manual = false) => {
        if (!db) return;
        if (manual) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);
        
        try {
            const testSetsCollection = collection(db, "testSets");
            const testSetSnapshot = await getDocs(testSetsCollection).catch(async (e) => {
                if (e.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: testSetsCollection.path,
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                }
                throw e;
            });
            const testSetList = testSetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestSet));
            setTestSets(testSetList);

            const schedulesCollection = collection(db, "scheduledTests");
            const scheduleSnapshot = await getDocs(schedulesCollection).catch(async (e) => {
                if (e.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: schedulesCollection.path,
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                }
                throw e;
            });
            const scheduleList = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledTest));
            
            const now = new Date();
            const updatedSchedules = scheduleList
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
        } catch (err: any) {
            if (err.code !== 'permission-denied') {
                setError(err.message || "The database connection is taking longer than expected. Please try refreshing.");
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [db]);

    useEffect(() => {
        if(db) fetchPageData();
        setDate(new Date());
    }, [db, fetchPageData]);
    
    const handleScheduleTest = async () => {
        if (!date || !selectedTestSetId || !time || !db) {
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

        const newTestId = `SCHED-${Date.now()}`;
        const newTest: ScheduledTest = {
            id: newTestId,
            testSetId: testSet.id,
            testSetName: testSet.name,
            dateTime: combinedDateTime.toISOString(),
            board: testSet.board,
            standard: testSet.standard,
            subject: testSet.subject,
        };

        const docRef = doc(db, "scheduledTests", newTestId);
        setDoc(docRef, newTest)
            .then(() => {
                fetchPageData(true);
                toast({
                    title: "Test Scheduled!",
                    description: `"${testSet.name}" has been added to the calendar for ${format(combinedDateTime, "PPP p")}.`
                });
                setSelectedTestSetId('');
                setDate(new Date());
                setTime('10:00');
            })
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'create',
                    requestResourceData: newTest,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground animate-pulse font-medium">Syncing Academic Calendar...</p>
          </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <CalendarIcon /> Mock Test Scheduler
                    </h1>
                    <p className="text-sm text-muted-foreground">Manage and assign dates to your practice test sets.</p>
                </div>
                <div className="flex items-center gap-2">
                    {error && <Badge variant="destructive" className="animate-pulse">Partial Sync Delay</Badge>}
                    <Button variant="outline" size="sm" onClick={() => fetchPageData(true)} disabled={isRefreshing}>
                        <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>
            
            {error && (
                <Alert variant="destructive" className="bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Synchronization Delay</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

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
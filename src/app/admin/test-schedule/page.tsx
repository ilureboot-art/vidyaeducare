"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, FilePlus, Loader2, AlertCircle, RefreshCcw, Clock, Search, FilterX, Edit } from "lucide-react";
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
import { type AcademicConfig, defaultAcademicConfig } from "@/lib/academic-config";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useDb, useAuth } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { EditScheduledTestDialog } from '@/components/admin/EditScheduledTestDialog';
import { calculateTestStatus, combineDateAndTime, validateScheduleEdit } from '@/lib/test-schedule-utils';

type TestStatus = 'Live' | 'Upcoming' | 'Practice Only';

type ScheduledTestWithStatus = ScheduledTest & { status: TestStatus };

export default function TestSchedulePage() {
    const { toast } = useToast();
    const db = useDb();
    const { user } = useAuth();

    const [allSchedules, setAllSchedules] = useState<ScheduledTestWithStatus[]>([]);
    const [testSets, setTestSets] = useState<TestSet[]>([]);
    const [academicConfig, setAcademicConfig] = useState<AcademicConfig>(defaultAcademicConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Form States
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState('10:00'); 
    const [duration, setDuration] = useState('30');
    const [selectedTestSetId, setSelectedTestSetId] = useState('');
    const [editingSchedule, setEditingSchedule] = useState<ScheduledTestWithStatus | null>(null);
    const [isEditSaving, setIsEditSaving] = useState(false);

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [boardFilter, setBoardFilter] = useState<string>("all");
    const [standardFilter, setStandardFilter] = useState<string>("all");
    const [subjectFilter, setSubjectFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    
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

            const configRef = doc(db, "configs", 'academic');
            const configSnap = await getDoc(configRef).catch(() => null);
            if (configSnap && configSnap.exists()) {
                setAcademicConfig(configSnap.data() as AcademicConfig);
            }
            
            const updatedSchedules = scheduleList
                .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                .map(test => {
                    return { ...test, status: calculateTestStatus(test) };
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
        const requestedTestSetId = new URLSearchParams(window.location.search).get('testSetId');
        if (requestedTestSetId) setSelectedTestSetId(requestedTestSetId);
    }, [db, fetchPageData]);

    const filteredSchedules = useMemo(() => {
        return allSchedules.filter(test => {
            const matchesSearch = test.testSetName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBoard = boardFilter === "all" || test.board === boardFilter;
            const matchesStandard = standardFilter === "all" || test.standard === standardFilter;
            const matchesSubject = subjectFilter === "all" || test.subject === subjectFilter;
            const matchesStatus = statusFilter === "all" || test.status === statusFilter;
            return matchesSearch && matchesBoard && matchesStandard && matchesSubject && matchesStatus;
        });
    }, [allSchedules, searchTerm, boardFilter, standardFilter, subjectFilter, statusFilter]);

    const resetFilters = () => {
        setSearchTerm("");
        setBoardFilter("all");
        setStandardFilter("all");
        setSubjectFilter("all");
        setStatusFilter("all");
    };
    
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

        const combinedDateTime = combineDateAndTime(date, time);
        const durationMinutes = Number(duration);
        if (!combinedDateTime) {
            toast({ variant: 'destructive', title: "Invalid Time", description: "Please enter a valid test time." });
            return;
        }
        const validation = validateScheduleEdit(combinedDateTime, durationMinutes);
        if (!validation.valid) {
            toast({ variant: 'destructive', title: "Invalid Schedule", description: validation.error });
            return;
        }

        const newTestId = `SCHED-${Date.now()}`;
        const newTest: ScheduledTest = {
            id: newTestId,
            testSetId: testSet.id,
            testSetName: testSet.name,
            dateTime: combinedDateTime.toISOString(),
            startsAt: Timestamp.fromDate(combinedDateTime),
            board: testSet.board,
            standard: testSet.standard,
            subject: testSet.subject,
            duration: durationMinutes,
            createdAt: new Date().toISOString(),
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
                setDuration('30');
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

    const handleUpdateTest = async (changes: Pick<ScheduledTest, 'dateTime' | 'duration'>) => {
        if (!db || !editingSchedule) return;
        setIsEditSaving(true);
        const docRef = doc(db, "scheduledTests", editingSchedule.id);
        const updateData = {
            ...changes,
            startsAt: Timestamp.fromDate(new Date(changes.dateTime)),
            updatedAt: serverTimestamp(),
            lastModifiedBy: user?.uid || 'unknown-admin',
        };
        try {
            await updateDoc(docRef, updateData);
            await fetchPageData(true);
            toast({ title: "Test Rescheduled", description: `Date, time and duration for "${editingSchedule.testSetName}" were updated.` });
            setEditingSchedule(null);
        } catch (e: any) {
            if (e.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                } satisfies SecurityRuleContext));
            }
            throw e;
        } finally {
            setIsEditSaving(false);
        }
    };

    const handleDeleteTest = async (id: string) => {
        if (!db) return;
        if (!confirm("Are you sure you want to remove this scheduled test?")) return;

        const docRef = doc(db, "scheduledTests", id);
        deleteDoc(docRef)
            .then(() => {
                fetchPageData(true);
                toast({ title: "Test Deleted", description: "The scheduled test has been removed." });
            })
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    }
    
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
                        <CalendarIcon /> MockArena Scheduler
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
                    <CardTitle>Schedule a New MockArena Session</CardTitle>
                    <CardDescription>
                        Select a pre-defined test set and assign it a date and time on the calendar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <div className="space-y-2 lg:col-span-2">
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
                         <div className="space-y-2">
                             <Label htmlFor="test-duration">Duration (Minutes)</Label>
                             <Input 
                                id="test-duration"
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                min="1"
                                max="300"
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Upcoming & Past Sessions</CardTitle>
                            <CardDescription>Filter and search through the academic calendar.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                            <FilterX className="mr-2 h-4 w-4"/> Clear All Filters
                        </Button>
                    </div>
                    <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search test name..." 
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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Upcoming">Upcoming</SelectItem>
                                <SelectItem value="Live">Live</SelectItem>
                                <SelectItem value="Practice Only">Practice Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Test Name</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSchedules.length > 0 ? filteredSchedules.map(test => (
                                <TableRow key={test.id} className="even:bg-muted/40 transition-colors group">
                                    <TableCell>{format(new Date(test.dateTime), "PPP p")}</TableCell>
                                    <TableCell className="font-medium">{test.testSetName}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{`${test.board} / ${test.standard} / ${test.subject}`}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Clock className="w-3 h-3 text-muted-foreground"/>
                                            {test.duration || 30} mins
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={test.status === 'Live' ? 'default' : test.status === 'Practice Only' ? 'secondary' : 'outline'}>
                                            {test.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingSchedule(test)}><Edit className="mr-1 h-3.5 w-3.5"/>Edit</Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTest(test.id)} className="text-destructive hover:bg-destructive/10">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        {allSchedules.length > 0 ? "No tests match your filters." : "No tests scheduled yet."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <EditScheduledTestDialog
                isOpen={Boolean(editingSchedule)}
                test={editingSchedule}
                onClose={() => setEditingSchedule(null)}
                onSave={handleUpdateTest}
                isSaving={isEditSaving}
            />
        </div>
    );
}

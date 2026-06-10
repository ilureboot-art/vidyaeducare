
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDb } from "@/firebase";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { PlusCircle, Trash2, Puzzle, Loader2, Save, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { TestSet } from "@/lib/question-bank";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuizClashTournament, QuizClashAutoCreateConfig } from "@/lib/quiz-clash-data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const initialAutoConfig: QuizClashAutoCreateConfig = {
    enabled: false,
    startTime: "20:00",
    type: "Pro",
    entryFee: 10,
    questionCount: 15,
    titlePrefix: "Daily Evening Clash",
};


export default function AdminQuizClashPage() {
    const { toast } = useToast();
    const db = useDb();
    const [tournaments, setTournaments] = useState<QuizClashTournament[] | null>(null);
    const [testSets, setTestSets] = useState<TestSet[] | null>(null);
    const [autoConfig, setAutoConfig] = useState<QuizClashAutoCreateConfig | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [newTournament, setNewTournament] = useState({
        title: "",
        startTime: "",
        type: "Pro" as "Pro" | "Practice",
        entryFee: 10,
        testSetId: ""
    });

    const fetchData = useCallback(async (manual = false) => {
        if (!db) return;
        if (manual) setIsRefreshing(true);
        
        try {
            // Parallel settled fetches to prevent one failure from blocking others
            const results = await Promise.allSettled([
                getDocs(collection(db, "quizClashTournaments")),
                getDocs(collection(db, "testSets")),
                getDoc(doc(db, "configs", "quizClash"))
            ]);

            // 1. Tournaments
            const tourneyRes = results[0];
            if (tourneyRes.status === 'fulfilled') {
                setTournaments(tourneyRes.value.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizClashTournament)));
            } else {
                if (tourneyRes.reason?.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'quizClashTournaments', operation: 'list' }));
                }
                setTournaments([]);
            }

            // 2. Test Sets
            const testSetRes = results[1];
            if (testSetRes.status === 'fulfilled') {
                setTestSets(testSetRes.value.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestSet)));
            } else {
                setTestSets([]);
            }

            // 3. Config
            const configRes = results[2];
            if (configRes.status === 'fulfilled' && configRes.value.exists()) {
                setAutoConfig(configRes.value.data() as QuizClashAutoCreateConfig);
            } else {
                setAutoConfig(initialAutoConfig);
            }

        } catch (error) {
            console.warn("Quiz Clash data sync error.");
        } finally {
            setIsRefreshing(false);
        }
    }, [db]);

    useEffect(() => {
        if(db) fetchData();
    }, [db, fetchData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewTournament(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof typeof newTournament, value: string) => {
        const updatedTournament = { ...newTournament, [name]: value };
        if (name === 'type' && value === 'Practice') {
            updatedTournament.entryFee = 0;
        }
        setNewTournament(updatedTournament);
    };
    
    const handleAutoConfigChange = (field: keyof QuizClashAutoCreateConfig, value: any) => {
        if (!autoConfig) return;
        setAutoConfig(prev => {
            if (!prev) return null;
            const updatedConfig = {...prev, [field]: value};
            if (field === 'type' && value === 'Practice') {
                updatedConfig.entryFee = 0;
            }
            return updatedConfig;
        });
    };

    const handleCreateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !newTournament.title || !newTournament.startTime || !newTournament.testSetId) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out all tournament details.' });
            return;
        }

        const selectedTestSet = testSets?.find(ts => ts.id === newTournament.testSetId);
        if (!selectedTestSet) {
             toast({ variant: 'destructive', title: 'Invalid Test Set', description: 'The selected test set could not be found.' });
            return;
        }

        const tournamentData: Omit<QuizClashTournament, 'id'> = {
            title: newTournament.title,
            startTime: new Date(newTournament.startTime).toISOString(),
            type: newTournament.type,
            entryFee: newTournament.type === 'Practice' ? 0 : Number(newTournament.entryFee),
            testSetId: newTournament.testSetId,
            questionCount: selectedTestSet.questions.length,
            registeredUsers: [],
            prizePool: 0,
            status: "scheduled",
        };

        const colRef = collection(db, "quizClashTournaments");
        addDoc(colRef, tournamentData)
            .then(async () => {
                fetchData(true);
                toast({ title: "Tournament Created!", description: `${newTournament.title} has been scheduled.` });
                setNewTournament({ title: "", startTime: "", type: "Pro", entryFee: 10, testSetId: "" });
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: colRef.path,
                    operation: 'create',
                    requestResourceData: tournamentData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const handleDeleteTournament = async (id: string) => {
        if (!db) return;
        const docRef = doc(db, "quizClashTournaments", id);
        deleteDoc(docRef)
            .then(async () => {
                fetchData(true);
                toast({ title: "Tournament Deleted" });
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    }
    
    const handleSaveAutoConfig = async () => {
        if (!autoConfig || !db) return;
        const configToSave = {
            ...autoConfig,
            entryFee: autoConfig.type === 'Practice' ? 0 : autoConfig.entryFee,
        };
        const docRef = doc(db, "configs", "quizClash");
        setDoc(docRef, configToSave)
            .then(() => {
                toast({ title: "Settings Saved", description: "Automatic tournament scheduler settings have been updated." });
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: configToSave,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    };


    if (!tournaments || !testSets || !autoConfig) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Syncing Quiz Clash Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2"><Puzzle/> Quiz Clash Management</h1>
                <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Automatic Tournament Scheduler</CardTitle>
                    <CardDescription>Configure settings to automatically create a new tournament every day with random questions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="scheduler-enabled" checked={autoConfig.enabled} onCheckedChange={(checked) => handleAutoConfigChange('enabled', checked)}/>
                        <Label htmlFor="scheduler-enabled">Enable Daily Auto-Creation</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
                         <div className="space-y-2">
                            <Label htmlFor="auto-title">Tournament Title Prefix</Label>
                            <Input id="auto-title" value={autoConfig.titlePrefix} onChange={(e) => handleAutoConfigChange('titlePrefix', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="auto-type">Type</Label>
                            <Select value={autoConfig.type} onValueChange={(v) => handleAutoConfigChange('type', v as 'Pro' | 'Practice')}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pro">Pro (Paid)</SelectItem>
                                    <SelectItem value="Practice">Practice (Free)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="auto-time">Daily Start Time</Label>
                            <Input id="auto-time" type="time" value={autoConfig.startTime} onChange={(e) => handleAutoConfigChange('startTime', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="auto-fee">Entry Fee (₹)</Label>
                            <Input id="auto-fee" type="number" value={autoConfig.entryFee} onChange={(e) => handleAutoConfigChange('entryFee', Number(e.target.value))} disabled={autoConfig.type === 'Practice'}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="auto-questions">Number of Questions</Label>
                            <Input id="auto-questions" type="number" value={autoConfig.questionCount} onChange={(e) => handleAutoConfigChange('questionCount', Number(e.target.value))} />
                        </div>
                    </div>
                </CardContent>
                <CardContent>
                     <Button onClick={handleSaveAutoConfig}>
                        <Save className="mr-2" /> Save Auto-Scheduler Settings
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Tournament Manually</CardTitle>
                </CardHeader>
                <form onSubmit={handleCreateTournament}>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="title">Tournament Name</Label>
                            <Input id="title" name="title" value={newTournament.title} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" value={newTournament.type} onValueChange={(v) => handleSelectChange('type', v as 'Pro' | 'Practice')} required>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pro">Pro (Paid)</SelectItem>
                                    <SelectItem value="Practice">Practice (Free)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                            <Input id="entryFee" name="entryFee" type="number" value={newTournament.entryFee} onChange={handleInputChange} required disabled={newTournament.type === 'Practice'}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input id="startTime" name="startTime" type="datetime-local" value={newTournament.startTime} onChange={handleInputChange} required />
                        </div>
                         <div className="space-y-2 lg:col-span-full">
                            <Label htmlFor="testSetId">Question Set</Label>
                            <Select name="testSetId" value={newTournament.testSetId} onValueChange={(v) => handleSelectChange('testSetId', v)} required>
                                <SelectTrigger><SelectValue placeholder="Select a test set..."/></SelectTrigger>
                                <SelectContent>
                                    {testSets.length > 0 ? testSets.map(ts => (
                                        <SelectItem key={ts.id} value={ts.id}>{ts.name} ({ts.questions.length} Qs)</SelectItem>
                                    )) : (
                                        <SelectItem value="none" disabled>No test sets available.</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardContent>
                        <Button type="submit">
                            <PlusCircle className="mr-2" /> Create Tournament
                        </Button>
                    </CardContent>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Scheduled Tournaments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>Entry Fee</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tournaments.length > 0 ? tournaments.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.title}</TableCell>
                                     <TableCell><Badge variant={t.type === 'Pro' ? 'default' : 'secondary'}>{t.type}</Badge></TableCell>
                                    <TableCell>{format(new Date(t.startTime), 'P p')}</TableCell>
                                    <TableCell>₹{t.entryFee}</TableCell>
                                    <TableCell>{t.registeredUsers.length}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTournament(t.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No tournaments scheduled.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

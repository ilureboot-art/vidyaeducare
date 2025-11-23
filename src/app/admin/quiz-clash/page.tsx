
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { PlusCircle, Trash2, Puzzle, Loader2, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { TestSet } from "@/lib/question-bank";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuizClashTournament, QuizClashAutoCreateConfig } from "@/lib/quiz-clash-data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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
    const { db, loading } = useFirebase();
    const [tournaments, setTournaments] = useState<QuizClashTournament[] | null>(null);
    const [testSets, setTestSets] = useState<TestSet[] | null>(null);
    const [autoConfig, setAutoConfig] = useState<QuizClashAutoCreateConfig | null>(null);
    
    const [newTournament, setNewTournament] = useState({
        title: "",
        startTime: "",
        type: "Pro" as "Pro" | "Practice",
        entryFee: 10,
        testSetId: ""
    });

    const fetchTournamentsAndTestSets = async (db: any) => {
        // Fetch tournaments
        const tournamentsSnapshot = await getDocs(collection(db, "quizClashTournaments"));
        const tournamentList = tournamentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizClashTournament));
        setTournaments(tournamentList);

        // Fetch test sets for manual creation
        const testSetsSnapshot = await getDocs(collection(db, "testSets"));
        const testSetList = testSetsSnapshot.docs.map(doc => doc.data() as TestSet);
        setTestSets(testSetList);
        
        // Fetch auto-create config
        const configDoc = await getDoc(doc(db, "configs", "quizClash"));
        if (configDoc.exists()) {
            setAutoConfig(configDoc.data() as QuizClashAutoCreateConfig);
        } else {
            setAutoConfig(initialAutoConfig);
        }
    };

    useEffect(() => {
        if(!loading && db) {
            fetchTournamentsAndTestSets(db);
        }
    }, [db, loading]);

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
            registeredPlayers: [],
            prizePool: 0,
            status: "scheduled",
        };

        try {
            await addDoc(collection(db, "quizClashTournaments"), tournamentData);
            await fetchTournamentsAndTestSets(db);
            toast({ title: "Tournament Created!", description: `${newTournament.title} has been scheduled.` });
            setNewTournament({ title: "", startTime: "", type: "Pro", entryFee: 10, testSetId: "" });
        } catch (error) {
            console.error("Error creating tournament:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create the tournament.' });
        }
    };
    
    const handleDeleteTournament = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, "quizClashTournaments", id));
            await fetchTournamentsAndTestSets(db);
            toast({ title: "Tournament Deleted" });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the tournament.' });
        }
    }
    
    const handleSaveAutoConfig = async () => {
        if (!autoConfig || !db) return;
        try {
            const configToSave = {
                ...autoConfig,
                entryFee: autoConfig.type === 'Practice' ? 0 : autoConfig.entryFee,
            };
            await setDoc(doc(db, "configs", "quizClash"), configToSave);
            toast({ title: "Settings Saved", description: "Automatic tournament scheduler settings have been updated." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the settings.' });
        }
    };


    if (loading || !tournaments || !testSets || !autoConfig) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2"><Puzzle/> Quiz Clash Management</h1>

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
                                    {testSets.map(ts => <SelectItem key={ts.id} value={ts.id}>{ts.name} ({ts.questions.length} Qs)</SelectItem>)}
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
                                <TableHead>Players</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tournaments.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.title}</TableCell>
                                     <TableCell><Badge variant={t.type === 'Pro' ? 'default' : 'secondary'}>{t.type}</Badge></TableCell>
                                    <TableCell>{format(new Date(t.startTime), 'P p')}</TableCell>
                                    <TableCell>₹{t.entryFee}</TableCell>
                                    <TableCell>{t.registeredPlayers.length}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTournament(t.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

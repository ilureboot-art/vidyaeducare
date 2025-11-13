
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { PlusCircle, Trash2, Puzzle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { TestSet } from "@/lib/question-bank";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuizClashTournament } from "@/lib/quiz-clash-data";

export default function AdminQuizClashPage() {
    const { toast } = useToast();
    const [tournaments, setTournaments] = useState<QuizClashTournament[] | null>(null);
    const [testSets, setTestSets] = useState<TestSet[] | null>(null);

    const [newTournament, setNewTournament] = useState({
        title: "",
        startTime: "",
        entryFee: 10,
        testSetId: ""
    });

    const fetchTournamentsAndTestSets = async () => {
        const tournamentsSnapshot = await getDocs(collection(db, "quizClashTournaments"));
        const tournamentList = tournamentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizClashTournament));
        setTournaments(tournamentList);

        const testSetsSnapshot = await getDocs(collection(db, "testSets"));
        const testSetList = testSetsSnapshot.docs.map(doc => doc.data() as TestSet);
        setTestSets(testSetList);
    };

    useEffect(() => {
        fetchTournamentsAndTestSets();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewTournament(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setNewTournament(prev => ({ ...prev, testSetId: value }));
    };

    const handleCreateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTournament.title || !newTournament.startTime || !newTournament.testSetId) {
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
            entryFee: Number(newTournament.entryFee),
            testSetId: newTournament.testSetId,
            questionCount: selectedTestSet.questions.length,
            registeredPlayers: [],
            prizePool: 0,
            status: "scheduled",
        };

        try {
            const docRef = await addDoc(collection(db, "quizClashTournaments"), tournamentData);
            await fetchTournamentsAndTestSets();
            toast({ title: "Tournament Created!", description: `${newTournament.title} has been scheduled.` });
            setNewTournament({ title: "", startTime: "", entryFee: 10, testSetId: "" });
        } catch (error) {
            console.error("Error creating tournament:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create the tournament.' });
        }
    };
    
    const handleDeleteTournament = async (id: string) => {
        try {
            await deleteDoc(doc(db, "quizClashTournaments", id));
            await fetchTournamentsAndTestSets();
            toast({ title: "Tournament Deleted" });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the tournament.' });
        }
    }

    if (!tournaments || !testSets) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2"><Puzzle/> Quiz Clash Management</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Tournament</CardTitle>
                </CardHeader>
                <form onSubmit={handleCreateTournament}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Tournament Name</Label>
                                <Input id="title" name="title" value={newTournament.title} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                                <Input id="entryFee" name="entryFee" type="number" value={newTournament.entryFee} onChange={handleInputChange} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input id="startTime" name="startTime" type="datetime-local" value={newTournament.startTime} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="testSetId">Question Set</Label>
                                <Select name="testSetId" value={newTournament.testSetId} onValueChange={handleSelectChange} required>
                                    <SelectTrigger><SelectValue placeholder="Select a test set..."/></SelectTrigger>
                                    <SelectContent>
                                        {testSets.map(ts => <SelectItem key={ts.id} value={ts.id}>{ts.name} ({ts.questions.length} Qs)</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
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


"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Puzzle, Users, IndianRupee, Loader2, GraduationCap, ChevronRight } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useDb } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, runTransaction, serverTimestamp } from "firebase/firestore";
import type { QuizClashTournament } from "@/lib/quiz-clash-data";
import type { StudentProfile } from "@/lib/student-data";
import { Badge } from "@/components/ui/badge";
import UserLayout from "@/components/UserLayout";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


function QuizClashPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const db = useDb();
  
  const [tournaments, setTournaments] = useState<QuizClashTournament[] | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isRegistering, setIsRegistering] = useState<QuizClashTournament | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    if (!db) return;
    const fetchTournaments = async () => {
        const tourneyCol = collection(db, "quizClashTournaments");
        const q = query(tourneyCol, where("status", "==", "scheduled"));
        
        try {
            const querySnapshot = await getDocs(q).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: tourneyCol.path,
                    operation: 'list',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                throw serverError;
            });
            const tournamentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizClashTournament));
            setTournaments(tournamentList);
        } catch (error) {
            console.warn("Quiz Clash fetch error handled.");
            setTournaments([]);
        }
    };
    fetchTournaments();

    if (user) {
        const fetchStudents = async () => {
            setIsLoadingStudents(true);
            const studentsCol = collection(db, "students");
            const q = query(studentsCol, where("parentId", "==", user.uid));
            try {
                const snap = await getDocs(q).catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: studentsCol.path,
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                    throw serverError;
                });
                setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentProfile)).filter(s => !s.archived));
            } catch (e) {
                setStudents([]);
            } finally {
                setIsLoadingStudents(false);
            }
        };
        fetchStudents();
    }
  }, [db, user]);

  const handleRegister = async (tournament: QuizClashTournament, studentId: string) => {
    if (!user || !db) return;

    try {
        const response = await fetch('/api/quiz-clash', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ action: 'join', tournamentId: tournament.id, studentId }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed.');
        toast({ title: 'Registration Successful', description: tournament.title });
        router.push(`/quiz-clash/play?tournamentId=${tournament.id}&studentId=${studentId}`);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Registration Failed', description: error instanceof Error ? error.message : 'Please retry.' });
    } finally { setIsRegistering(null); }
  };

  if (tournaments === null) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Entering Quiz Clash Arena...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
          <Puzzle className="w-10 h-10" /> Quiz Clash
        </h1>
        <p className="text-muted-foreground mt-2">Compete in live quiz tournaments and win big!</p>
      </div>

      <Card>
        <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 text-center md:text-left">
            <p>1. Register a student for an upcoming tournament. Pro Clashes require an entry fee.</p>
            <p>2. Compete in a live time-bound challenge.</p>
            <p>3. Performance and earnings are automatically synced to the student profile.</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Upcoming Tournaments</h2>
        {tournaments.length > 0 ? (
            <div className="space-y-4">
            {tournaments.map((tourney) => {
                const isRegistered = user ? tourney.registeredUsers.includes(user.uid) : false;
                return (
                    <Card key={tourney.id} className="shadow-md">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div>
                                <CardTitle>{tourney.title}</CardTitle>
                                <CardDescription>
                                Goes live at {new Date(tourney.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {new Date(tourney.startTime).toLocaleDateString()}
                                </CardDescription>
                            </div>
                             <Badge variant={tourney.type === 'Pro' ? 'default' : 'secondary'}>{tourney.type} Clash</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-lg text-primary">{tourney.type === 'Pro' ? `₹${tourney.entryFee}`: 'FREE'}</h4>
                            <p className="text-xs text-muted-foreground">Entry Fee</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-lg">{tourney.questionCount}</h4>
                            <p className="text-xs text-muted-foreground">Questions</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-lg">{tourney.registeredUsers.length}</h4>
                            <p className="text-xs text-muted-foreground">Users Registered</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <h4 className="font-bold text-lg text-green-700 dark:text-green-300">₹{tourney.prizePool}</h4>
                            <p className="text-xs text-muted-foreground">Prize Pool</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => setIsRegistering(tourney)} disabled={isRegistered}>
                            {isRegistered ? "Enter Arena (Session Active)" : tourney.type === 'Pro' ? `Select Student & Register (₹${tourney.entryFee})` : 'Select Student & Play Free'}
                        </Button>
                    </CardFooter>
                    </Card>
                )
            })}
            </div>
        ) : (
             <Card>
                <CardContent className="text-center p-12">
                    <p className="text-muted-foreground">No upcoming tournaments scheduled. Check back soon!</p>
                </CardContent>
            </Card>
        )}
      </div>

      <Dialog open={!!isRegistering} onOpenChange={(open) => !open && setIsRegistering(null)}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle>Who is playing?</DialogTitle>
                  <DialogDescription>Select the student profile to associate with this tournament session.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-4">
                  {students.length > 0 ? students.map(s => (
                      <Button key={s.id} variant="outline" className="w-full h-auto p-4 justify-between group hover:border-primary" onClick={() => isRegistering && handleRegister(isRegistering, s.id)}>
                          <div className="flex items-center gap-4">
                              <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors"><GraduationCap className="w-5 h-5 text-primary"/></div>
                              <div className="text-left">
                                  <p className="font-bold">{s.name}</p>
                                  <p className="text-[10px] uppercase font-black opacity-50">{s.academic.standard} • {s.academic.board}</p>
                              </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all"/>
                      </Button>
                  )) : (
                      <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No students found. Add a student profile first.</p>
                          <Button asChild variant="link" className="mt-2"><Link href="/profile">Add Student →</Link></Button>
                      </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}

export default function QuizClashPage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <QuizClashPageContent />
            </UserLayout>
        </ProtectedRoute>
    );
}


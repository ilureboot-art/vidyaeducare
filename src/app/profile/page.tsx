"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Mail, Calendar, Phone, GraduationCap, Trash2, PlusCircle, BookOpen, Loader2, BarChart2, Users, BrainCircuit, Sparkles, ScrollText, ArrowRight, Trophy, Award, IndianRupee, Star, Target, Search, AlertCircle, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, Cell } from "recharts";
import { format, addMinutes, isAfter, isBefore } from "date-fns";
import type { StudentProfile } from "@/lib/student-data";
import type { ScheduledTest } from "@/lib/test-schedule";
import { useAuth, useDb } from "@/firebase";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc, query, where, DocumentData, onSnapshot } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { cn } from "@/lib/utils";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Checkbox } from "@/components/ui/checkbox";
import { type AcademicConfig, defaultAcademicConfig } from "@/lib/academic-config";

const BADGE_COLORS = {
    'Platinum': 'text-slate-400 fill-slate-100',
    'Gold': 'text-yellow-500 fill-yellow-100',
    'Silver': 'text-gray-400 fill-gray-100',
    'Bronze': 'text-amber-600 fill-amber-100',
};

function ProfilePageContent() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, isResolved } = useAuth();
    const db = useDb();
    
    const [parentProfile, setParentProfile] = useState<DocumentData | null>(null);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [validCodes, setValidCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [activationCode, setActivationCode] = useState("");
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [selectedStudentForTest, setSelectedStudentForTest] = useState<StudentProfile | null>(null);
    const [availableTests, setAvailableTests] = useState<ScheduledTest[]>([]);
    const [isLoadingTests, setIsLoadingTests] = useState(false);

    const [academicConfig, setAcademicConfig] = useState<AcademicConfig>(defaultAcademicConfig);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedSubjectsForNewStudent, setSelectedSubjectsForNewStudent] = useState<string[]>([]);
    const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
    const [selectedStudentForManageSubjects, setSelectedStudentForManageSubjects] = useState<StudentProfile | null>(null);
    const [selectedSubjectsForManage, setSelectedSubjectsForManage] = useState<string[]>([]);

    useEffect(() => {
        if (!isResolved || !db || !user) {
            if (isResolved) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        const parentDocRef = doc(db, "users", user.uid);
        const unsubParent = onSnapshot(parentDocRef, (docSnap) => {
            if (docSnap.exists()) setParentProfile(docSnap.data());
            setIsLoading(false);
        }, async (error) => {
            console.error("Parent sync error:", error);
            setIsLoading(false);
        });

        const studentsColRef = collection(db, "students");
        const q = query(studentsColRef, where("parentId", "==", user.uid));
        const unsubStudents = onSnapshot(q, (snapshot) => {
            const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
            setStudents(studentList);
            setIsLoading(false);
        }, async (error) => {
            console.warn("Student fetch sync delay.");
            setIsLoading(false);
        });

        const codesDocRef = doc(db, "activationCodes", user.uid);
        const unsubCodes = onSnapshot(codesDocRef, (docSnap) => {
            setValidCodes(docSnap.exists() ? docSnap.data().codes : []);
        }, async (error) => {
             setValidCodes([]);
             setIsLoading(false);
        });

        const academicDocRef = doc(db, "configs", "academic");
        const unsubAcademic = onSnapshot(academicDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAcademicConfig(docSnap.data() as AcademicConfig);
            } else {
                setAcademicConfig(defaultAcademicConfig);
            }
        }, async (error) => {
            console.warn("Academic config fetch error, falling back:", error);
            setAcademicConfig(defaultAcademicConfig);
        });
        
        const timeout = setTimeout(() => setIsLoading(false), 3000);

        return () => {
            unsubParent();
            unsubStudents();
            unsubCodes();
            unsubAcademic();
            clearTimeout(timeout);
        };
    }, [user, db, isResolved]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()));
    }, [students, studentSearchTerm]);

    const handleVerifyCode = () => {
        if (validCodes.includes(activationCode)) {
            setIsCodeVerified(true);
            toast({ title: "Code Verified!", description: "You can now add the student's details." });
        } else {
            toast({ variant: 'destructive', title: "Invalid Code", description: "The activation code is incorrect or has already been used." });
        }
    };
    
    const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !db) return;

        const formData = new FormData(e.currentTarget);
        const studentName = formData.get('name') as string;
        const newStudentId = `STU-${String(Date.now()).slice(-6)}`;
        
        const newStudent: StudentProfile = {
            id: newStudentId,
            parentId: user.uid,
            name: studentName,
            dob: formData.get('dob') as string,
            avatarUrl: `https://picsum.photos/seed/${newStudentId}/100/100`,
            academic: {
                standard: formData.get('standard') as string,
                board: formData.get('board') as "CBSE" | "ICSE" | "SSC",
                stream: formData.get('stream') as string,
                language: 'English',
                academicYear: '2024-2025',
                subjects: selectedSubjectsForNewStudent.length > 0 ? selectedSubjectsForNewStudent : ['Maths', 'Science', 'English', 'History', 'General Knowledge'],
            },
            stats: {
                totalEarnings: 0,
                testsTaken: 0,
                avgScore: 0,
                performance: [],
                recentActivity: [],
            },
            badges: [],
        };
        
        const studentDocRef = doc(db, "students", newStudentId);
        setDoc(studentDocRef, newStudent)
            .then(async () => {
                const updatedCodes = validCodes.filter(c => c !== activationCode);
                const codesDocRef = doc(db, "activationCodes", user.uid);
                await updateDoc(codesDocRef, { codes: updatedCodes });
                toast({ title: "Student Added!", description: `${newStudent.name}'s profile has been created.`});
                setIsAddStudentOpen(false);
                setActivationCode("");
                setIsCodeVerified(false);
                setSelectedSubjectsForNewStudent([]);
            })
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: studentDocRef.path,
                    operation: 'create',
                    requestResourceData: newStudent,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    }

    const handleUpdateSubjects = async (studentId: string, updatedSubjects: string[]) => {
        if (!db) return;
        const studentRef = doc(db, "students", studentId);
        updateDoc(studentRef, {
            "academic.subjects": updatedSubjects
        })
        .then(() => {
            toast({ title: "Subjects Updated", description: "The student's subjects have been saved." });
            setIsManageSubjectsOpen(false);
        })
        .catch(async (e) => {
            const permissionError = new FirestorePermissionError({
                path: studentRef.path,
                operation: 'update',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const openManageSubjectsDialog = (student: StudentProfile) => {
        setSelectedStudentForManageSubjects(student);
        setSelectedSubjectsForManage(student.academic.subjects || []);
        setIsManageSubjectsOpen(true);
    };
    
    const handleDeleteStudent = async (studentId: string) => {
        if (!db) return;
        if (!confirm("Are you sure you want to remove this student profile?")) return;
        
        const studentDocRef = doc(db, "students", studentId);
        deleteDoc(studentDocRef)
            .then(() => {
                toast({ title: "Student Removed", description: "The student profile has been deleted." });
            })
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: studentDocRef.path,
                    operation: 'delete',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
    }
    
    const openTestDialog = async (student: StudentProfile) => {
        if (!db) return;
        setSelectedStudentForTest(student);
        setIsTestDialogOpen(true);
        setIsLoadingTests(true);
        try {
            const scheduledColRef = collection(db, "scheduledTests");
            const q = query(
                scheduledColRef, 
                where("board", "==", student.academic.board),
                where("standard", "==", student.academic.standard)
            );
            const snapshot = await getDocs(q).catch(async (serverError) => {
                if (serverError.code === 'permission-denied') {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: scheduledColRef.path, operation: 'list' }));
                }
                throw serverError;
            });
            const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledTest));
            setAvailableTests(tests.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
        } catch (e) {
            setAvailableTests([]);
        } finally {
            setIsLoadingTests(false);
        }
    };
    
    const handleStartTest = (test: ScheduledTest) => {
        if (!selectedStudentForTest) return;
        const now = new Date();
        const testDate = new Date(test.dateTime);
        const duration = test.duration || 30;
        const expiryDate = addMinutes(testDate, duration);
        
        // Reward eligibility logic: Only tests happening right now qualify for rewards
        const isLive = isAfter(now, testDate) && isBefore(now, expiryDate);
        
        router.push(`/mock-test?studentId=${selectedStudentForTest.id}&testId=${test.id}&isLive=${isLive}`);
    }

  if (isLoading) {
    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground animate-pulse font-medium">Syncing Academic Workspace...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
        {parentProfile && (
            <Card className="border-primary/10 shadow-sm overflow-hidden">
                <div className="h-2 bg-primary w-full" />
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2"><User className="text-primary" /> Parent Account</CardTitle>
                    <CardDescription>Primary profile for managing student subscriptions and wallet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-transparent hover:border-primary/10 transition-colors">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><User className="w-4 h-4"/></div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Account Holder</p>
                                <p className="font-bold">{parentProfile.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-transparent hover:border-primary/10 transition-colors">
                             <div className="p-2 bg-primary/10 rounded-lg text-primary"><Mail className="w-4 h-4"/></div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Registered Email</p>
                                <p className="font-bold truncate max-w-[150px]">{parentProfile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-transparent hover:border-primary/10 transition-colors">
                             <div className="p-2 bg-primary/10 rounded-lg text-primary"><Phone className="w-4 h-4"/></div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Contact</p>
                                <p className="font-bold">{parentProfile.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-transparent hover:border-primary/10 transition-colors">
                             <div className="p-2 bg-primary/10 rounded-lg text-primary"><Calendar className="w-4 h-4"/></div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Member Since</p>
                                <p className="font-bold">{parentProfile.joinDate ? format(new Date(parentProfile.joinDate), 'PP') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><BrainCircuit size={80}/></div>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-black text-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> AI ACADEMIC SUITE ACTIVE
                </CardTitle>
                <CardDescription>Premium bilingual AI tools available for all your students.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-4 p-4 bg-background rounded-xl border group hover:border-accent/50 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-accent/10 rounded-lg"><BrainCircuit className="w-6 h-6 text-accent" /></div>
                        <div>
                            <p className="font-bold text-sm">Vidya AI Doubt Solver</p>
                            <p className="text-[10px] text-muted-foreground font-medium">Instant bilingual explanations.</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="group-hover:translate-x-1 transition-transform">
                        <Link href="/ai-tutor"><ArrowRight size={18}/></Link>
                    </Button>
                </div>
                <div className="flex items-center justify-between gap-4 p-4 bg-background rounded-xl border group hover:border-primary/50 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg"><ScrollText className="w-6 h-6 text-primary" /></div>
                        <div>
                            <p className="font-bold text-sm">Vidya QuickNotes</p>
                            <p className="text-[10px] text-muted-foreground font-medium">Auto-summaries from textbooks.</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="group-hover:translate-x-1 transition-transform">
                        <Link href="/ai-notes"><ArrowRight size={18}/></Link>
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                <h1 className="text-3xl font-black tracking-tighter text-primary italic uppercase">STUDENT WORKSPACE</h1>
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search students..." 
                        className="pl-9 bg-background border-primary/20 rounded-2xl h-11 focus-visible:ring-primary shadow-sm"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                    />
                </div>
             </div>
             <Dialog open={isAddStudentOpen} onOpenChange={(isOpen) => {
                 setIsAddStudentOpen(isOpen);
                 if (!isOpen) {
                     setActivationCode("");
                     setIsCodeVerified(false);
                 }
             }}>
                <DialogTrigger asChild>
                    <Button size="lg" className="shadow-xl font-black uppercase tracking-tight h-11 px-8 rounded-2xl">
                        <PlusCircle className="mr-2 h-5 w-5"/> Add Student
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCodeVerified ? "Add Student Details" : "Enter Activation Code"}</DialogTitle>
                        <DialogDescription>
                            {isCodeVerified 
                                ? "Fill in the details for the new student profile." 
                                : "A product activation code is required to create a student workspace."}
                        </DialogDescription>
                    </DialogHeader>
                    {!isCodeVerified ? (
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="activationCode">Product Activation Code</Label>
                                <Input 
                                    id="activationCode" 
                                    value={activationCode} 
                                    onChange={(e) => setActivationCode(e.target.value)}
                                    placeholder="e.g., PROD-123456"
                                    className="font-mono text-center text-lg tracking-widest"
                                />
                                <p className="text-[10px] text-center text-muted-foreground">Found in your purchase receipt or activation card.</p>
                            </div>

                            {validCodes.length > 0 && (
                                <div className="p-4 bg-muted/50 rounded-2xl border border-dashed border-primary/20 space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Your Purchased Unused Activation Codes:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {validCodes.map(code => (
                                            <Button 
                                                key={code}
                                                type="button"
                                                variant="outline" 
                                                size="sm" 
                                                className="font-mono text-xs font-bold bg-background hover:bg-primary/10 hover:border-primary/30"
                                                onClick={() => setActivationCode(code)}
                                            >
                                                {code}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button className="w-full font-bold" onClick={handleVerifyCode} disabled={!activationCode.trim()}>Verify Product Code</Button>
                        </div>
                    ) : (
                       <form className="space-y-4" onSubmit={handleAddStudent}>
                           <div className="space-y-2">
                               <Label htmlFor="name">Student's Full Name</Label>
                               <Input id="name" name="name" required placeholder="Enter student's name"/>
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="dob">Date of Birth</Label>
                               <Input id="dob" name="dob" type="date" required/>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="standard">Standard</Label>
                                    <Select name="standard" required>
                                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                        <SelectContent>
                                            {[...Array(12)].map((_,i) => <SelectItem key={i+1} value={`${i+1}th`}>{i+1}th</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="board">Board</Label>
                                    <Select name="board" required>
                                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CBSE">CBSE</SelectItem>
                                            <SelectItem value="ICSE">ICSE</SelectItem>
                                            <SelectItem value="SSC">SSC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                           </div>
                            <div className="space-y-2">
                                <Label>Subjects Enrolled</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border p-3 rounded-xl bg-background">
                                    {academicConfig.subjects.map((subj) => (
                                        <div key={subj} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`add-subj-${subj}`}
                                                checked={selectedSubjectsForNewStudent.includes(subj)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedSubjectsForNewStudent(prev => [...prev, subj]);
                                                    } else {
                                                        setSelectedSubjectsForNewStudent(prev => prev.filter(s => s !== subj));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`add-subj-${subj}`} className="text-sm font-medium cursor-pointer">{subj}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                           <DialogFooter>
                               <Button type="submit" className="w-full sm:w-auto font-black">ACTIVATE STUDENT WORKSPACE</Button>
                           </DialogFooter>
                       </form>
                    )}
                </DialogContent>
             </Dialog>
        </div>

       <div className="grid gap-8">
        {filteredStudents.length > 0 ? filteredStudents.map(student => (
            <Card key={student.id} className="shadow-2xl relative group overflow-hidden border-none ring-1 ring-primary/10 transition-all hover:ring-primary/30">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-primary/[0.03] p-8 border-b">
                    <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-3xl font-black text-primary tracking-tighter uppercase italic">
                                    {student.name}
                                </CardTitle>
                                <Badge variant="outline" className="bg-white/50 text-[10px] font-black uppercase tracking-widest">{student.academic.board}</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                    <GraduationCap size={16} className="text-primary"/> {student.academic.standard} Standard
                                </p>
                                <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500"/> Global Rank #4
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="text-center px-6 py-2 bg-green-500/10 rounded-2xl border border-green-500/20">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Total Earnings</p>
                            <p className="text-2xl font-black text-green-600 flex items-center justify-center gap-1">
                                <IndianRupee size={18}/>{student.stats?.totalEarnings?.toLocaleString() || '0'}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteStudent(student.id)}>
                            <Trash2 className="w-5 h-5"/>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <BarChart2 size={14} className="text-primary"/> Academic Performance
                        </h3>
                        <div className="h-48 w-full">
                            {student.stats?.performance && student.stats.performance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={student.stats.performance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis fontSize={10} domain={[0, 100]} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(63, 81, 181, 0.05)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                                        formatter={(value) => [`${value}%`, "Score"]} 
                                    />
                                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                        {student.stats.performance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score >= 70 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-primary/10 p-6 text-center">
                                    <Target className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="font-bold">No Records Yet</p>
                                    <p className="mt-1 opacity-70">Complete your first MockArena test to see your progress chart.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Award size={14} className="text-accent"/> Winning Badges
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            {['Platinum', 'Gold', 'Silver', 'Bronze'].map((bType) => {
                                const isEarned = student.badges?.includes(bType as any);
                                return (
                                    <div key={bType} className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                                        isEarned ? "bg-white shadow-md border-primary/10" : "bg-muted/50 border-transparent opacity-30 grayscale"
                                    )}>
                                        <Trophy className={cn("w-8 h-8", isEarned ? BADGE_COLORS[bType as keyof typeof BADGE_COLORS] : "text-muted-foreground")} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">{bType}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                            <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Consistency Streak</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-accent/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent w-[75%]" />
                                </div>
                                <span className="text-xs font-black text-accent">12 Days</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Info size={14} className="text-primary"/> Student Insight
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-xl border border-primary/5">
                                <span className="text-xs font-bold text-muted-foreground">Average Accuracy</span>
                                <span className="text-sm font-black text-primary">{student.stats?.avgScore || 0}%</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-xl border border-primary/5">
                                <span className="text-xs font-bold text-muted-foreground">MockArena Sessions</span>
                                <span className="text-sm font-black text-primary">{student.stats?.testsTaken || 0}</span>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl border border-primary/10">
                                <span className="text-xs font-black text-primary uppercase">Current Standing</span>
                                <span className="text-sm font-black text-primary">#4 / 1,240</span>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-8 bg-primary/[0.03] border-t gap-4">
                    <Button className="flex-grow py-8 text-xl font-black shadow-2xl hover:scale-[1.02] transition-transform" onClick={() => openTestDialog(student)}>
                        <BookOpen className="mr-3 h-6 w-6"/>
                        OPEN MOCKARENA HUB
                    </Button>
                    <Button variant="outline" className="py-8 font-black uppercase tracking-tight border-2 hover:bg-muted text-xs px-6" onClick={() => openManageSubjectsDialog(student)}>
                        Manage Subjects
                    </Button>
                </CardFooter>
            </Card>
        )) : studentSearchTerm ? (
            <Card className="border-dashed border-2 border-primary/20 bg-muted/5">
                <CardContent className="text-center p-20 space-y-4">
                    <Search className="text-muted-foreground/30 w-12 h-12 mx-auto" />
                    <p className="text-xl font-black text-muted-foreground uppercase">No match for "{studentSearchTerm}"</p>
                    <Button variant="outline" onClick={() => setStudentSearchTerm("")}>Clear Search</Button>
                </CardContent>
            </Card>
        ) : (
            <Card className="border-dashed border-2 border-primary/20 bg-muted/5">
                <CardContent className="text-center p-20 space-y-6">
                    <div className="bg-primary/5 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto border-2 border-dashed border-primary/20">
                        <Users className="text-primary/30 w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-2xl font-black text-primary italic uppercase tracking-tight">Your Education Hub is Empty</p>
                        <p className="text-muted-foreground max-w-sm mx-auto font-medium">To start learning and winning prizes, purchase a subscription and activate a student profile.</p>
                    </div>
                    <Button asChild size="lg" className="px-10 font-black shadow-xl">
                        <Link href="/store">VISIT THE STORE</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
       </div>
       
       <Dialog open={isTestDialogOpen} onOpenChange={(isOpen) => {
            setIsTestDialogOpen(isOpen);
            if (!isOpen) {
                setSelectedSubject(null);
            }
       }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="text-primary" /> MockArena Hub: {selectedStudentForTest?.name}
                    </DialogTitle>
                    <DialogDescription>
                        Live curriculum-aligned MockArena sessions and practice.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                    {isLoadingTests ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Syncing Question Bank...</p>
                        </div>
                    ) : selectedSubject === null ? (
                        <div className="space-y-3">
                            {(selectedStudentForTest?.academic?.subjects || []).map(subject => {
                                const tests = availableTests.filter(test => test.subject === subject);
                                const now = new Date();
                                const hasLive = tests.some(test => {
                                    const testDate = new Date(test.dateTime);
                                    const duration = test.duration || 30;
                                    const expiryDate = addMinutes(testDate, duration);
                                    return isAfter(now, testDate) && isBefore(now, expiryDate);
                                });
                                
                                return (
                                    <Button
                                        key={subject}
                                        variant="outline"
                                        className="w-full justify-between items-center h-16 p-4 rounded-2xl hover:border-primary/50 group transition-all"
                                        onClick={() => setSelectedSubject(subject)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-105 transition-transform"><BookOpen size={16}/></div>
                                            <span className="font-bold text-sm text-foreground">{subject}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasLive && <Badge className="bg-red-500 text-white animate-pulse text-[8px] h-4">LIVE</Badge>}
                                            <Badge variant="secondary" className="text-[10px]">{tests.length} {tests.length === 1 ? 'Session' : 'Sessions'}</Badge>
                                        </div>
                                    </Button>
                                );
                            })}
                            {(!selectedStudentForTest?.academic?.subjects || selectedStudentForTest.academic.subjects.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground italic text-sm">
                                    No subjects selected. Click "Manage Subjects" on your profile to select subjects.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs font-bold text-primary mb-2 pl-0 hover:bg-transparent"
                                onClick={() => setSelectedSubject(null)}
                            >
                                ← Back to Subjects
                            </Button>
                            <div className="space-y-3">
                                {availableTests.filter(test => test.subject === selectedSubject).length > 0 ? (
                                    availableTests.filter(test => test.subject === selectedSubject).map(test => {
                                        const now = new Date();
                                        const testDate = new Date(test.dateTime);
                                        const duration = test.duration || 30;
                                        const expiryDate = addMinutes(testDate, duration);
                                        
                                        const isUpcoming = isBefore(now, testDate);
                                        const isLive = isAfter(now, testDate) && isBefore(now, expiryDate);
                                        
                                        return (
                                            <div key={test.id} className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border bg-card transition-all group",
                                                isLive ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "hover:border-primary/30"
                                            )}>
                                                <div className="space-y-1">
                                                    <p className="font-black text-sm leading-none text-primary">{test.testSetName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{format(testDate, "PPP p")}</p>
                                                        {isLive && <Badge className="h-4 px-1 text-[8px] animate-pulse bg-red-500 hover:bg-red-500 border-none">LIVE REWARDS</Badge>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant={isLive ? "default" : isUpcoming ? "outline" : "secondary"} className="text-[9px] font-black uppercase tracking-tighter px-2 h-5">
                                                        {isLive ? "Live Arena" : isUpcoming ? "Upcoming" : "Practice Only"}
                                                    </Badge>
                                                    <Button 
                                                        size="sm" 
                                                        className={cn("font-bold px-4 h-8", isUpcoming && "opacity-50")} 
                                                        disabled={isUpcoming}
                                                        onClick={() => handleStartTest(test)}
                                                    >
                                                        {isUpcoming ? <Clock size={14}/> : "START"}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-12 space-y-2 text-muted-foreground text-sm">
                                        <p className="font-bold">No MockArena sessions scheduled.</p>
                                        <p className="text-xs opacity-75">Check back later for scheduled tests for {selectedSubject}.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
       </Dialog>

       {/* Manage Subjects Dialog */}
       <Dialog open={isManageSubjectsOpen} onOpenChange={setIsManageSubjectsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Subjects: {selectedStudentForManageSubjects?.name}</DialogTitle>
                    <DialogDescription>
                        Select the final subjects enrolled for this student profile.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded-lg bg-background">
                        {academicConfig.subjects.map((subj) => (
                            <div key={subj} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`manage-subj-${subj}`}
                                    checked={selectedSubjectsForManage.includes(subj)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedSubjectsForManage(prev => [...prev, subj]);
                                        } else {
                                            setSelectedSubjectsForManage(prev => prev.filter(s => s !== subj));
                                        }
                                    }}
                                />
                                <Label htmlFor={`manage-subj-${subj}`} className="text-sm font-medium cursor-pointer">{subj}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full font-black"
                            onClick={() => {
                                if (selectedStudentForManageSubjects) {
                                    handleUpdateSubjects(selectedStudentForManageSubjects.id, selectedSubjectsForManage);
                                }
                            }}
                        >
                            SAVE SUBJECTS
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
       </Dialog>
    </div>
  );
}

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <ProfilePageContent />
            </UserLayout>
        </ProtectedRoute>
    );
}

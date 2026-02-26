"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Mail, Calendar, Phone, GraduationCap, Trash2, PlusCircle, BookOpen, Loader2, BarChart2, Users as UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from "recharts";
import { format } from "date-fns";
import type { StudentProfile } from "@/lib/student-data";
import type { ScheduledTest } from "@/lib/test-schedule";
import { useAuth, useDb } from "@/firebase";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc, query, where, DocumentData, onSnapshot } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";

function ProfilePageContent() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const db = useDb();
    
    const [parentProfile, setParentProfile] = useState<DocumentData | null>(null);
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [validCodes, setValidCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [activationCode, setActivationCode] = useState("");
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [selectedStudentForTest, setSelectedStudentForTest] = useState<StudentProfile | null>(null);
    const [availableTests, setAvailableTests] = useState<ScheduledTest[]>([]);
    const [isLoadingTests, setIsLoadingTests] = useState(false);

    useEffect(() => {
        if (user && db) {
            setIsLoading(true);
            
            const unsubParent = onSnapshot(doc(db, "users", user.uid), (doc) => {
                if (doc.exists()) setParentProfile(doc.data());
                setIsLoading(false);
            }, () => setIsLoading(false));

            const q = query(collection(db, "students"), where("parentId", "==", user.uid));
            const unsubStudents = onSnapshot(q, (snapshot) => {
                const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
                setStudents(studentList);
            });

            const unsubCodes = onSnapshot(doc(db, "activationCodes", user.uid), (doc) => {
                setValidCodes(doc.exists() ? doc.data().codes : []);
            });
            
            return () => {
                unsubParent();
                unsubStudents();
                unsubCodes();
            };
        }
    }, [user, db]);

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
                subjects: ['Maths', 'Science', 'English', 'History', 'General Knowledge'],
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
        
        try {
            await setDoc(doc(db, "students", newStudentId), newStudent);
            const updatedCodes = validCodes.filter(c => c !== activationCode);
            await updateDoc(doc(db, "activationCodes", user.uid), { codes: updatedCodes });
            toast({ title: "Student Added!", description: `${newStudent.name}'s profile has been created.`});
            setIsAddStudentOpen(false);
            setActivationCode("");
            setIsCodeVerified(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not create student profile." });
        }
    }
    
    const handleDeleteStudent = async (studentId: string) => {
        if (!db) return;
        if (!confirm("Are you sure you want to remove this student profile?")) return;
        try {
            await deleteDoc(doc(db, "students", studentId));
            toast({ title: "Student Removed", description: "The student profile has been deleted." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not delete student profile." });
        }
    }
    
    const openTestDialog = async (student: StudentProfile) => {
        if (!db) return;
        setSelectedStudentForTest(student);
        setIsTestDialogOpen(true);
        setIsLoadingTests(true);
        try {
            const q = query(
                collection(db, "scheduledTests"), 
                where("board", "==", student.academic.board),
                where("standard", "==", student.academic.standard)
            );
            const snapshot = await getDocs(q);
            const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledTest));
            setAvailableTests(tests.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
        } catch (e) {
            toast({ variant: 'destructive', title: "Error", description: "Could not load tests." });
        } finally {
            setIsLoadingTests(false);
        }
    };
    
    const handleStartTest = (test: ScheduledTest) => {
        if (!selectedStudentForTest) return;
        const now = new Date();
        const testDate = new Date(test.dateTime);
        const isLive = testDate <= now;
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
    <div className="w-full max-w-5xl mx-auto space-y-8">
        {parentProfile && (
            <Card className="border-primary/10 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2"><User className="text-primary" /> Parent Profile</CardTitle>
                    <CardDescription>Your primary account details and communication preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <User className="w-5 h-5 text-primary"/>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Account Holder</p>
                                <p className="font-semibold">{parentProfile.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Mail className="w-5 h-5 text-primary"/>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Email ID</p>
                                <p className="font-semibold">{parentProfile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Phone className="w-5 h-5 text-primary"/>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">WhatsApp Number</p>
                                <p className="font-semibold">{parentProfile.phone || 'Not Provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Calendar className="w-5 h-5 text-primary"/>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Member Since</p>
                                <p className="font-semibold">{parentProfile.joinDate ? format(new Date(parentProfile.joinDate), 'PP') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
             <Dialog open={isAddStudentOpen} onOpenChange={(isOpen) => {
                 setIsAddStudentOpen(isOpen);
                 if (!isOpen) {
                     setActivationCode("");
                     setIsCodeVerified(false);
                 }
             }}>
                <DialogTrigger asChild>
                    <Button size="lg" className="shadow-md"><PlusCircle className="mr-2 h-5 w-5"/> Add New Student</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCodeVerified ? "Add Student Details" : "Enter Activation Code"}</DialogTitle>
                        <DialogDescription>
                            {isCodeVerified 
                                ? "Fill in the details for the new student profile." 
                                : "You need a product activation code to add a new student."}
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
                                    className="font-mono"
                                />
                            </div>
                            <Button className="w-full" onClick={handleVerifyCode} disabled={!activationCode.trim()}>Verify Code</Button>
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
                           <DialogFooter>
                               <Button type="submit" className="w-full sm:w-auto">Create Student Profile</Button>
                           </DialogFooter>
                       </form>
                    )}
                </DialogContent>
             </Dialog>
        </div>

       <div className="grid gap-6">
        {students.length > 0 ? students.map(student => (
            <Card key={student.id} className="shadow-lg relative group overflow-hidden border-none ring-1 ring-border">
                <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/30 p-6">
                    <div className="flex items-center gap-5">
                        <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                            <AvatarImage src={student.avatarUrl} alt={student.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl font-bold text-primary tracking-tight">
                                {student.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="font-mono text-[10px]">{student.id}</Badge>
                                <span className="text-xs text-muted-foreground">• {student.academic.board} Board</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                                <GraduationCap size={14}/> Academic Profile
                            </h3>
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                <p><span className="text-muted-foreground">Standard:</span> <span className="font-semibold">{student.academic.standard}</span></p>
                                <p><span className="text-muted-foreground">Stream:</span> <span className="font-semibold">{student.academic.stream}</span></p>
                                <p><span className="text-muted-foreground">Language:</span> <span className="font-semibold">{student.academic.language}</span></p>
                                <p><span className="text-muted-foreground">D.O.B:</span> <span className="font-semibold">{student.dob ? format(new Date(student.dob), 'PP') : 'N/A'}</span></p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                            <BarChart2 size={14}/> Performance Analytics
                        </h3>
                        <div className="h-40 w-full">
                            {student.stats?.performance && student.stats.performance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={student.stats.performance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis fontSize={10} domain={[0, 100]} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ fontSize: '12px' }} formatter={(value) => [`${value}%`, "Score"]} />
                                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                    No tests recorded yet.
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-6 bg-muted/10 border-t">
                    <Button className="w-full py-6 text-lg font-bold shadow-sm" onClick={() => openTestDialog(student)}>
                        <BookOpen className="mr-2 h-5 w-5"/>
                        View & Start Academic Tests
                    </Button>
                </CardFooter>
            </Card>
        )) : (
            <Card className="border-dashed border-2">
                <CardContent className="text-center p-16 space-y-4">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <UsersIcon className="text-muted-foreground w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-lg font-bold">No Student Profiles Found</p>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Purchase a subscription in the store to get an activation code.</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/store">Go to Store</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
       </div>
       
       <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tests for {selectedStudentForTest?.name}</DialogTitle>
                    <DialogDescription>
                        Available tests for {selectedStudentForTest?.academic.board} {selectedStudentForTest?.academic.standard}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                    {isLoadingTests ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-xs text-muted-foreground">Syncing question bank...</p>
                        </div>
                    ) : availableTests.length > 0 ? (
                        availableTests.map(test => {
                            const now = new Date();
                            const testDate = new Date(test.dateTime);
                            const isCompleted = testDate < now;
                            return (
                                <div key={test.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm leading-none">{test.testSetName}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">{format(testDate, "PPP p")}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={isCompleted ? "secondary" : "default"} className="text-[9px] uppercase tracking-tighter">
                                            {isCompleted ? "Practice" : "Live"}
                                        </Badge>
                                        <Button size="sm" onClick={() => handleStartTest(test)}>Start</Button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-12 space-y-2">
                            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto opacity-20" />
                            <p className="text-sm text-muted-foreground font-medium">No tests available yet.</p>
                        </div>
                    )}
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

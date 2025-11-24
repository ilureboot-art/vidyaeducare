
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Mail, Calendar, Phone, Edit, GraduationCap, Trash2, PlusCircle, BookOpen, Loader2, BarChart2 } from "lucide-react";
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
import { useAuth, useDbService } from "@/firebase/provider";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc, query, where, DocumentData, onSnapshot, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";


function ProfilePageContent() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const db = useDbService();
    
    const [parentProfile, setParentProfile] = useState<DocumentData | null>(null);
    const [students, setStudents] = useState<StudentProfile[] | null>(null);
    const [validCodes, setValidCodes] = useState<string[] | null>(null);
    const [allScheduledTests, setAllScheduledTests] = useState<ScheduledTest[] | null>(null);
    
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [activationCode, setActivationCode] = useState("");
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [selectedStudentForTest, setSelectedStudentForTest] = useState<StudentProfile | null>(null);
    const [availableTests, setAvailableTests] = useState<ScheduledTest[]>([]);

    useEffect(() => {
        if (user && db) {
            const unsubParent = onSnapshot(doc(db, "users", user.uid), (doc) => {
                if (doc.exists()) setParentProfile(doc.data());
            });

            const q = query(collection(db, "students"), where("parentId", "==", user.uid));
            const fetchStudents = async () => {
                const querySnapshot = await getDocs(q);
                const studentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
                setStudents(studentList);
            };
            fetchStudents();
            const unsubStudents = onSnapshot(q, (snapshot) => {
                const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentProfile));
                setStudents(studentList);
            });


            const unsubCodes = onSnapshot(doc(db, "activationCodes", user.uid), (doc) => {
                setValidCodes(doc.exists() ? doc.data().codes : []);
            });
            
            const fetchTests = async () => {
                const testsSnapshot = await getDocs(collection(db, "scheduledTests"));
                const testsList = testsSnapshot.docs.map(doc => doc.data() as ScheduledTest);
                setAllScheduledTests(testsList);
            };
            fetchTests();

            return () => {
                unsubParent();
                unsubStudents();
                unsubCodes();
            };
        }
    }, [user, db]);

    const handleVerifyCode = () => {
        if (!validCodes) return;
        if (validCodes.includes(activationCode)) {
            setIsCodeVerified(true);
            toast({ title: "Code Verified!", description: "You can now add the student's details." });
        } else {
            toast({ variant: 'destructive', title: "Invalid Code", description: "The activation code is incorrect or has already been used." });
        }
    };
    
    const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!students || !validCodes || !user || !db) return;

        const formData = new FormData(e.currentTarget);
        const studentName = formData.get('name') as string;
        const newStudentId = `STU-${String(Date.now()).slice(-6)}`;
        
        const newStudent: StudentProfile = {
            id: newStudentId,
            parentId: user.uid,
            name: studentName,
            dob: formData.get('dob') as string,
            avatarUrl: `https://placehold.co/100x100.png?text=${studentName.charAt(0)}`,
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
            setStudents([...students, newStudent]);

            const updatedCodes = validCodes.filter(c => c !== activationCode);
            await updateDoc(doc(db, "activationCodes", user.uid), { codes: updatedCodes });

            toast({ title: "Student Added!", description: `${newStudent.name}'s profile has been created.`});
            setIsAddStudentOpen(false);
            setActivationCode("");
            setIsCodeVerified(false);

        } catch (error) {
            console.error("Error adding student:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not create student profile." });
        }
    }
    
    const handleDeleteStudent = async (studentId: string) => {
        if (!students || !user || !db) return;
        try {
            await deleteDoc(doc(db, "students", studentId));
            setStudents(students.filter(s => s.id !== studentId));
            toast({ title: "Student Removed", description: "The student profile has been deleted." });
        } catch (error) {
            console.error("Error deleting student:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not delete student profile." });
        }
    }
    
    const openTestDialog = (student: StudentProfile) => {
        if (!allScheduledTests) return;
        setSelectedStudentForTest(student);
        const tests = allScheduledTests.filter(test => test.board === student.academic.board && test.standard === student.academic.standard);
        const sortedTests = tests.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        setAvailableTests(sortedTests);
        setIsTestDialogOpen(true);
    };
    
    const handleStartTest = (test: ScheduledTest) => {
        if (!selectedStudentForTest) return;
        const now = new Date();
        const testDate = new Date(test.dateTime);
        const isLive = testDate <= now;
        router.push(`/mock-test?studentId=${selectedStudentForTest.id}&testId=${test.id}&isLive=${isLive}`);
    }

  if (!students || !validCodes || !allScheduledTests || !parentProfile) {
    return (
        <div className="w-full max-w-5xl mx-auto flex items-center justify-center h-96">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><User /> Parent Profile</CardTitle>
                <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <User className="w-5 h-5 text-muted-foreground"/>
                        <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="font-medium">{parentProfile.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="w-5 h-5 text-muted-foreground"/>
                        <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium">{parentProfile.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Phone className="w-5 h-5 text-muted-foreground"/>
                        <div>
                            <p className="text-xs text-muted-foreground">WhatsApp Number</p>
                            <p className="font-medium">{parentProfile.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-muted-foreground"/>
                        <div>
                            <p className="text-xs text-muted-foreground">Member Since</p>
                            <p className="font-medium">{format(new Date(parentProfile.joinDate), 'P')}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold">My Students</h1>
             <Dialog open={isAddStudentOpen} onOpenChange={(isOpen) => {
                 setIsAddStudentOpen(isOpen);
                 if (!isOpen) {
                     setActivationCode("");
                     setIsCodeVerified(false);
                 }
             }}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2"/> Add New Student</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCodeVerified ? "Add Student Details" : "Enter Activation Code"}</DialogTitle>
                        <DialogDescription>
                            {isCodeVerified 
                                ? "Fill in the details for the new student profile." 
                                : "You need a product activation code from a subscription purchase to add a new student."}
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
                                    placeholder="Enter code from store purchase"
                                />
                            </div>
                            <Button className="w-full" onClick={handleVerifyCode} disabled={!activationCode.trim()}>Verify Code</Button>
                        </div>
                    ) : (
                       <form className="space-y-4" onSubmit={handleAddStudent}>
                           <div className="space-y-2">
                               <Label htmlFor="name">Student's Full Name</Label>
                               <Input id="name" name="name" required/>
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="dob">Date of Birth</Label>
                               <Input id="dob" name="dob" type="date" required/>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="standard">Standard</Label>
                                    <Select name="standard" required><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{[...Array(12)].map((_,i) => <SelectItem key={i+1} value={`${i+1}th`}>{i+1}th</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="board">Board</Label>
                                    <Select name="board" required><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent><SelectItem value="CBSE">CBSE</SelectItem><SelectItem value="ICSE">ICSE</SelectItem><SelectItem value="SSC">SSC</SelectItem></SelectContent></Select>
                                </div>
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="stream">Stream</Label>
                               <Select name="stream" required><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent><SelectItem value="Science">Science</SelectItem><SelectItem value="Commerce">Commerce</SelectItem><SelectItem value="Arts">Arts</SelectItem><SelectItem value="General">General</SelectItem></SelectContent></Select>
                           </div>
                           <DialogFooter>
                               <Button type="submit">Create Profile</Button>
                           </DialogFooter>
                       </form>
                    )}
                </DialogContent>
             </Dialog>
        </div>

       {students.map(student => (
         <Card key={student.id} className="shadow-lg relative group overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/30 p-4">
                <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20 border-4 border-primary/20">
                        <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="profile avatar" />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary">
                            <span>{student.name}</span>
                        </CardTitle>
                        <CardDescription>ID: {student.id}</CardDescription>
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="outline" size="icon"><Edit className="w-4 h-4"/></Button>
                     <Button variant="destructive" size="icon" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="w-4 h-4"/></Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 grid md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                     <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><GraduationCap size={16}/> Academic Details</h3>
                     <div className="space-y-2 text-sm pl-2 border-l-2">
                        <p><strong>D.O.B:</strong> {format(new Date(student.dob), 'P')}</p>
                        <p><strong>Standard:</strong> {student.academic.standard}</p>
                        <p><strong>Board:</strong> {student.academic.board}</p>
                        <p><strong>Stream:</strong> {student.academic.stream}</p>
                        <p><strong>Language:</strong> {student.academic.language}</p>
                     </div>
                </div>
                <div>
                     <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><BarChart2 size={16}/> Performance Analytics</h3>
                    <div className="grid grid-cols-3 gap-2 text-center my-4">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Avg. Score</p>
                            <p className="text-xl font-bold">{student.stats.avgScore.toFixed(0)}%</p>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Highest</p>
                            <p className="text-xl font-bold">{student.stats.performance.length > 0 ? Math.max(...student.stats.performance.map(p => p.score)) : 0}%</p>
                        </div>
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Tests Taken</p>
                            <p className="text-xl font-bold">{student.stats.testsTaken}</p>
                        </div>
                    </div>
                     <div className="h-40 pr-0">
                        {student.stats.performance && student.stats.performance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={student.stats.performance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                                <YAxis fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                    }}
                                    labelStyle={{ fontWeight: 'bold' }}
                                    formatter={(value) => [`${value}%`, "Score"]}
                                />
                                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-muted/20 rounded-lg">
                                No performance data yet.
                            </div>
                        )}
                     </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/30">
                 <Button className="w-full" onClick={() => openTestDialog(student)}>
                    <BookOpen className="mr-2"/>
                    View & Start Available Tests
                </Button>
            </CardFooter>
        </Card>
       ))}

       {students.length === 0 && (
           <Card>
               <CardContent className="text-center p-12">
                   <p className="text-muted-foreground">No student profiles found.</p>
                   <p className="text-muted-foreground">Purchase a subscription in the store to get an activation code, then add a student.</p>
               </CardContent>
           </Card>
       )}
       
       <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Available Tests for {selectedStudentForTest?.name}</DialogTitle>
                    <DialogDescription>Select a test from the list to begin. Completed tests can be taken for practice.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 pt-4 max-h-[60vh] overflow-y-auto">
                    {availableTests.length > 0 ? (
                        availableTests.map(test => {
                            const now = new Date();
                            const testDate = new Date(test.dateTime);
                            const isCompleted = testDate < now;

                            return (
                                <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <p className="font-semibold">{test.testSetName}</p>
                                        <p className="text-sm text-muted-foreground">{format(testDate, "PPP p")}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={isCompleted ? "secondary" : "default"}>
                                            {isCompleted ? "Practice" : "Live"}
                                        </Badge>
                                        <Button onClick={() => handleStartTest(test)}>Start Test</Button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No tests available for this student's board and standard.</p>
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
            <ProfilePageContent />
        </ProtectedRoute>
    );
}

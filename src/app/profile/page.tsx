
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Mail, Calendar, Phone, Edit, GraduationCap, Building, Languages, BookCopy, FileClock, Cake, Medal, BarChart2, Trash2, PlusCircle, TrendingUp, BookOpen, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { studentData, type StudentProfile, addStudent, deleteStudent, validActivationCodes, useActivationCode } from "@/lib/student-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid } from "recharts";
import { Separator } from "@/components/ui/separator";

function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  if (!formattedDate) {
    return null; 
  }

  return <>{formattedDate}</>;
}


export default function ProfilePage() {
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const { toast } = useToast();
    const router = useRouter();
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [activationCode, setActivationCode] = useState("");
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    
    // State for mock test dialog
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [selectedStudentForTest, setSelectedStudentForTest] = useState<StudentProfile | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

    // This effect ensures the component uses the latest data from the module
    useEffect(() => {
        setStudents([...studentData]);
    }, []);

    // Static parent data for display
    const parentProfile = {
        name: "Alex Doe",
        email: "alex.doe@example.com",
        phone: "+91 12345 67890",
        joinDate: "2024-07-01",
    };

    const handleVerifyCode = () => {
        if (validActivationCodes.includes(activationCode)) {
            setIsCodeVerified(true);
            toast({ title: "Code Verified!", description: "You can now add the student's details." });
        } else {
            toast({ variant: 'destructive', title: "Invalid Code", description: "The activation code is incorrect or has already been used." });
        }
    };
    
    const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newStudent: StudentProfile = {
            id: `STU-${String(Date.now()).slice(-6)}`,
            name: formData.get('name') as string,
            dob: formData.get('dob') as string,
            avatarUrl: `https://placehold.co/100x100.png?text=${(formData.get('name') as string).charAt(0)}`,
            academic: {
                standard: formData.get('standard') as string,
                board: formData.get('board') as string,
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
        
        addStudent(newStudent);
        useActivationCode(activationCode);
        setStudents([...studentData]);
        toast({ title: "Student Added!", description: `${newStudent.name}'s profile has been created.`});
        setIsAddStudentOpen(false);
        setActivationCode("");
        setIsCodeVerified(false);
    }
    
    const handleDeleteStudent = (studentId: string) => {
        deleteStudent(studentId);
        setStudents([...studentData]);
        toast({ title: "Student Removed", description: "The student profile has been deleted." });
    }
    
    const openTestDialog = (student: StudentProfile) => {
        setSelectedStudentForTest(student);
        setSelectedSubject(null); // Reset subject selection
        setIsTestDialogOpen(true);
    };
    
    const handleStartTest = () => {
        if (!selectedStudentForTest || !selectedSubject) {
             toast({ variant: "destructive", title: "Selection Missing", description: "Please select a subject to start the test."});
            return;
        }
        router.push(`/mock-test?studentId=${selectedStudentForTest.id}&subject=${selectedSubject}`);
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
                            <p className="font-medium"><FormattedDate dateString={parentProfile.joinDate} /></p>
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
                            <Button className="w-full" onClick={handleVerifyCode}>Verify Code</Button>
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
         <Card key={student.id} className="shadow-lg relative group">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20 border-4 border-primary/20">
                            <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="profile avatar" />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl font-bold text-primary">
                                <span>{student.name}</span>
                            </CardTitle>
                            <CardDescription>ID: {student.id} | <span className="font-semibold">{student.academic.standard} {student.academic.board}</span></CardDescription>
                             <div className="flex flex-wrap gap-1 mt-2">
                                {student.badges.length > 0 ? student.badges.map(badge => <Badge key={badge} variant="default" className="bg-yellow-500 hover:bg-yellow-600"><Medal className="mr-1.5"/>{badge}</Badge>) : <Badge variant="secondary">No badges yet</Badge>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="outline" size="icon"><Edit className="w-4 h-4"/></Button>
                         <Button variant="destructive" size="icon" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                         <Card>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg flex items-center gap-2"><GraduationCap/> Academics</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">D.O.B</span>
                                    <span className="font-medium"><FormattedDate dateString={student.dob} /></span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stream</span>
                                    <span className="font-medium">{student.academic.stream}</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">Language</span>
                                    <span className="font-medium">{student.academic.language}</span>
                                </div>
                            </CardContent>
                         </Card>
                         <Card>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg flex items-center gap-2"><Activity/> Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-sm">
                                {student.stats.recentActivity.length > 0 ? (
                                    <ul className="space-y-2">
                                        {student.stats.recentActivity.map((activity, index) => (
                                            <li key={index} className="flex items-center justify-between">
                                                <span>{activity.name}</span>
                                                <Badge variant="outline">{activity.score}%</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground">No recent test activity.</p>
                                )}
                            </CardContent>
                         </Card>
                    </div>
                    <div className="md:col-span-2">
                       <Card className="h-full">
                         <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><BarChart2/> Performance</CardTitle>
                            <CardDescription>Score analysis from the last few mock tests.</CardDescription>
                         </CardHeader>
                         <CardContent className="grid grid-cols-3 gap-2 text-center pb-4">
                             <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Avg. Score</p>
                                <p className="text-xl font-bold">{student.stats.avgScore}%</p>
                            </div>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Highest</p>
                                <p className="text-xl font-bold">{student.stats.performance.length > 0 ? Math.max(...student.stats.performance.map(p => p.score)) : 0}%</p>
                            </div>
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Tests Taken</p>
                                <p className="text-xl font-bold">{student.stats.testsTaken}</p>
                            </div>
                         </CardContent>
                         <CardContent className="h-48 pr-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={student.stats.performance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/>
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
                         </CardContent>
                       </Card>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => openTestDialog(student)}>
                    <BookOpen className="mr-2"/>
                    Start Mock Test for {student.name.split(' ')[0]}
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
       
       {/* Mock Test Dialog */}
       <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Start Mock Test for {selectedStudentForTest?.name}</DialogTitle>
                    <DialogDescription>Select a subject to begin the test.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject-select">Subject</Label>
                        <Select onValueChange={setSelectedSubject} value={selectedSubject || ''}>
                            <SelectTrigger id="subject-select"><SelectValue placeholder="Choose a subject..." /></SelectTrigger>
                            <SelectContent>
                                {selectedStudentForTest?.academic.subjects.map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleStartTest} disabled={!selectedSubject}>Start Test</Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>

    </div>
  );
}

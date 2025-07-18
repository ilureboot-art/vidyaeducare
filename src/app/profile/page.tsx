
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, TrendingUp, Gamepad2, Percent, Edit, Fingerprint, GraduationCap, Building, Languages, BookCopy, FileClock, PlusCircle, Trash2, Cake, Medal, BarChart2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { studentData } from "@/lib/student-data";
import type { StudentProfile } from "@/lib/student-data";


// In a real app, these would be managed on the backend.
const validActivationCodes = new Set(["PROD-12345", "PROD-ABCDE"]);

function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  if (!formattedDate) {
    return null; // Or a loading skeleton
  }

  return <>{formattedDate}</>;
}

export default function ProfilePage() {
    const [students, setStudents] = useState<StudentProfile[]>(studentData);
    const { toast } = useToast();
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [activationCode, setActivationCode] = useState('');
    const [isCodeVerified, setIsCodeVerified] = useState(false);

    const handleActivationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (validActivationCodes.has(activationCode)) {
        setIsCodeVerified(true);
        toast({ title: "Code Verified!", description: "You can now add a new student profile." });
      } else {
        toast({ variant: 'destructive', title: "Invalid Code", description: "The activation code is incorrect." });
      }
    };

    const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const dob = (form.elements.namedItem('dob') as HTMLInputElement).value;

        if (!name || !dob) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
            return;
        }

        const newStudent: StudentProfile = {
            id: `STU-${String(Date.now()).slice(-4)}`,
            name,
            dob,
            avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
            academic: {
                standard: (form.elements.namedItem('standard') as HTMLSelectElement).value,
                board: (form.elements.namedItem('board') as HTMLSelectElement).value,
                stream: (form.elements.namedItem('stream') as HTMLSelectElement).value,
                language: (form.elements.namedItem('language') as HTMLSelectElement).value,
                academicYear: "2024-2025",
                subjects: ["Maths", "Science", "English", "History"], // Placeholder
            },
            stats: { totalEarnings: 0, testsTaken: 0, avgScore: 0 },
            badges: [],
        };

        const updatedStudents = [...students, newStudent];
        setStudents(updatedStudents);
        // This is a temporary solution to update the shared data. In a real app, this would be an API call.
        studentData.splice(0, studentData.length, ...updatedStudents);

        toast({
            title: "Student Added!",
            description: `${name}'s profile has been created successfully.`
        });
        
        // Reset state
        validActivationCodes.delete(activationCode); // Mark code as used
        setIsAddStudentOpen(false);
        setIsCodeVerified(false);
        setActivationCode('');
    };

    const handleDeleteStudent = (studentId: string) => {
        const updatedStudents = students.filter(s => s.id !== studentId);
        setStudents(updatedStudents);
        studentData.splice(0, studentData.length, ...updatedStudents);

        toast({
            title: "Student Removed",
            description: `The student profile has been removed.`
        });
    };


  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
             <div className="space-y-1">
                <h1 className="text-3xl font-bold text-primary">My Students</h1>
                <p className="text-muted-foreground">Manage student profiles for mock test access.</p>
             </div>
              <Dialog open={isAddStudentOpen} onOpenChange={(isOpen) => {
                  setIsAddStudentOpen(isOpen);
                  if (!isOpen) {
                    setIsCodeVerified(false);
                    setActivationCode('');
                  }
              }}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2"/> Add New Student</Button>
                </DialogTrigger>
                <DialogContent>
                    {!isCodeVerified ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Enter Product Activation Code</DialogTitle>
                                <DialogDescription>
                                    To add a new student, you must first verify your product purchase. Please enter the activation code you received from the store.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleActivationSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="activation-code">Activation Code</Label>
                                    <Input 
                                      id="activation-code" 
                                      value={activationCode} 
                                      onChange={(e) => setActivationCode(e.target.value)} 
                                      required 
                                      placeholder="e.g., PROD-12345"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit"><ShieldCheck className="mr-2"/>Verify Code</Button>
                                </DialogFooter>
                            </form>
                        </>
                    ) : (
                        <>
                        <DialogHeader>
                            <DialogTitle>Create New Student Profile</DialogTitle>
                            <DialogDescription>
                                Each product purchase allows you to create one student profile. Fill in the details below.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input id="dob" name="dob" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="standard">Standard</Label>
                                    <Select name="standard" required>
                                        <SelectTrigger id="standard"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {[...Array(12)].map((_, i) => <SelectItem key={i+1} value={`${i+1}th`}>{i+1}th</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="board">Board</Label>
                                    <Select name="board" required>
                                        <SelectTrigger id="board"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CBSE">CBSE</SelectItem>
                                            <SelectItem value="SSC Maharashtra">SSC Maharashtra</SelectItem>
                                            <SelectItem value="ICSE">ICSE</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stream">Stream</Label>
                                    <Select name="stream" required>
                                        <SelectTrigger id="stream"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Science">Science</SelectItem>
                                            <SelectItem value="Commerce">Commerce</SelectItem>
                                            <SelectItem value="Arts">Arts</SelectItem>
                                            <SelectItem value="General">General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="language">Language Medium</Label>
                                    <Select name="language" required>
                                        <SelectTrigger id="language"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Hindi">Hindi</SelectItem>
                                            <SelectItem value="Marathi">Marathi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Profile</Button>
                            </DialogFooter>
                        </form>
                      </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
      
       {students.map(student => (
        <Card key={student.id} className="shadow-lg">
            <CardHeader>
            <div className="flex items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="profile avatar" />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-primary flex items-center justify-between">
                        <span>{student.name}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm"><Edit className="mr-2"/> Edit</Button>
                             <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="mr-2"/> Delete</Button>
                        </div>
                    </CardTitle>
                    <CardDescription>Student ID: {student.id}</CardDescription>
                </div>
            </div>
            </CardHeader>
            <CardContent className="space-y-6">
            
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><GraduationCap/> Academic Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <Cake className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">D.O.B</span>
                                <span><FormattedDate dateString={student.dob} /></span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <GraduationCap className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Standard</span>
                                <span>{student.academic.standard}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <Building className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Board</span>
                                <span>{student.academic.board}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <FileClock className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Year</span>
                                <span>{student.academic.academicYear}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <Languages className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Language</span>
                                <span>{student.academic.language}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-muted-foreground"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Stream</span>
                                <span>{student.academic.stream}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg col-span-2 md:col-span-3">
                            <BookCopy className="w-4 h-4 text-muted-foreground mt-1"/>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Subjects</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {student.academic.subjects.map(sub => <Badge key={sub} variant="secondary">{sub}</Badge>)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><BarChart2/> Performance Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Percent className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400 mb-1"/>
                            <p className="text-xl font-bold">{student.stats.avgScore}%</p>
                            <p className="text-xs text-muted-foreground">Avg. Score</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <TrendingUp className="w-5 h-5 mx-auto text-green-600 dark:text-green-400 mb-1"/>
                            <p className="text-xl font-bold">₹{student.stats.totalEarnings}</p>
                            <p className="text-xs text-muted-foreground">Earnings</p>
                        </div>
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                            <Gamepad2 className="w-5 h-5 mx-auto text-pink-600 dark:text-pink-400 mb-1"/>
                            <p className="text-xl font-bold">{student.stats.testsTaken}</p>
                            <p className="text-xs text-muted-foreground">Tests Taken</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg col-span-2 md:col-span-3">
                            <Medal className="w-5 h-5 mx-auto text-yellow-600 dark:text-yellow-400 mb-1"/>
                            <p className="text-xs text-muted-foreground mb-2">Badges Earned</p>
                            <div className="flex justify-center gap-2">
                                {student.badges.length > 0 ? student.badges.map(badge => <Badge key={badge} variant="default">{badge}</Badge>) : <p className="text-sm">No badges yet.</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            
            </CardContent>
        </Card>
      ))}
    </div>
  );
}

    

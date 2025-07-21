
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Mail, Calendar, Phone, Gamepad2, Percent, Edit, Fingerprint, GraduationCap, Building, Languages, BookCopy, FileClock, Cake, Medal, BarChart2, Trash2, PlusCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { studentData, type StudentProfile, addStudent, deleteStudent, validActivationCodes, useActivationCode } from "@/lib/student-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [activationCode, setActivationCode] = useState("");
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
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
                <div className="flex justify-end">
                    <Button variant="outline">Edit Profile</Button>
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
                        <Avatar className="w-24 h-24 border-4 border-primary/20">
                            <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="profile avatar" />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-3xl font-bold text-primary">
                                <span>{student.name}</span>
                            </CardTitle>
                            <CardDescription>Student ID: {student.id}</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="outline" size="icon"><Edit className="w-4 h-4"/></Button>
                         <Button variant="destructive" size="icon" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="w-4 h-4"/></Button>
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

       {students.length === 0 && (
           <Card>
               <CardContent className="text-center p-12">
                   <p className="text-muted-foreground">No student profiles found.</p>
                   <p className="text-muted-foreground">Purchase a subscription in the store to get an activation code, then add a student.</p>
               </CardContent>
           </Card>
       )}
    </div>
  );
}
    
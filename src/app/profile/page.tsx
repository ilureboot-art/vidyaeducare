
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, TrendingUp, Gamepad2, Percent, Edit, Fingerprint, GraduationCap, Building, Languages, BookCopy, FileClock, PlusCircle, Trash2, Cake } from "lucide-react";
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


type StudentProfile = {
  id: string;
  name: string;
  dob: string;
  avatarUrl: string;
  academic: {
      standard: string;
      board: string;
      stream: string;
      language: string;
      academicYear: string;
      subjects: string[];
  },
  stats: {
    totalEarnings: number;
    testsTaken: number;
    avgScore: number;
  }
};

const initialStudentProfiles: StudentProfile[] = [
  {
    id: "STU-001",
    name: "Alex Doe",
    dob: "2008-05-15",
    avatarUrl: "https://placehold.co/100x100.png",
    academic: {
      standard: "10th",
      board: "CBSE",
      stream: "Science",
      language: "English",
      academicYear: "2024-2025",
      subjects: ["Maths", "Science", "English"],
    },
    stats: {
      totalEarnings: 0,
      testsTaken: 0,
      avgScore: 0,
    },
  },
];


export default function ProfilePage() {
    const [students, setStudents] = useState<StudentProfile[]>(initialStudentProfiles);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { toast } = useToast();

    const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const dob = (form.elements.namedItem('dob') as HTMLInputElement).value;
        // In a real app, you'd handle file uploads for avatars properly
        
        const newStudent: StudentProfile = {
            id: `STU-00${students.length + 1}`,
            name,
            dob,
            avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
            academic: {
                standard: (form.elements.namedItem('standard') as HTMLInputElement).value,
                board: (form.elements.namedItem('board') as HTMLInputElement).value,
                stream: 'Science', // Placeholder
                language: 'English', // Placeholder
                academicYear: '2024-2025', // Placeholder
                subjects: [], // Placeholder
            },
            stats: { testsTaken: 0, avgScore: 0, totalEarnings: 0 }
        };

        setStudents([...students, newStudent]);
        toast({
            title: "Student Added!",
            description: `${name} has been added to your account.`
        });
        setIsAddDialogOpen(false);
    }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">My Students</CardTitle>
          <CardDescription>Manage student profiles linked to your account. Purchase new products from the store to add more students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {students.map(student => (
                <Card key={student.id} className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <Avatar className="w-20 h-20 border-4 border-primary/20">
                            <AvatarImage src={student.avatarUrl} alt={student.name} data-ai-hint="profile avatar" />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold">{student.name}</h3>
                                    <p className="text-sm text-muted-foreground">ID: {student.id}</p>
                                </div>
                                <div className="flex gap-2">
                                     <Button variant="outline" size="icon"><Edit className="w-4 h-4"/></Button>
                                     <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4"/></Button>
                                </div>
                            </div>
                           
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Cake className="w-4 h-4 text-muted-foreground"/>
                                    <span>{new Date(student.dob).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <GraduationCap className="w-4 h-4 text-muted-foreground"/>
                                    <span>{student.academic.standard}</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Building className="w-4 h-4 text-muted-foreground"/>
                                    <span>{student.academic.board}</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Languages className="w-4 h-4 text-muted-foreground"/>
                                    <span>{student.academic.language}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mt-4">
                        <PlusCircle className="mr-2"/>
                        Add New Student
                    </Button>
                </DialogTrigger>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Create New Student Profile</DialogTitle>
                        <DialogDescription>
                            Add the details for the new student. This action consumes one of your purchased product slots.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Student's Full Name</Label>
                            <Input id="name" name="name" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" name="dob" type="date" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="standard">Academic Standard</Label>
                            <Select name="standard" required>
                                <SelectTrigger><SelectValue placeholder="Select standard..." /></SelectTrigger>
                                <SelectContent>
                                    {Array.from({length: 12}, (_, i) => `${i+1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`).map(std => (
                                        <SelectItem key={std} value={std}>{std} Standard</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="board">Education Board</Label>
                            <Select name="board" required>
                                <SelectTrigger><SelectValue placeholder="Select board..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CBSE">CBSE</SelectItem>
                                    <SelectItem value="ICSE">ICSE</SelectItem>
                                    <SelectItem value="SSC Maharashtra">SSC Maharashtra</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         {/* Fields for subjects, language etc. would go here */}
                         <DialogFooter>
                            <Button type="submit">Save Student Profile</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

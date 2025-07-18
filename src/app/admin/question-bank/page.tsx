
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea";

type Question = {
  id: string;
  text: string;
  subject: string;
  standard: string;
  options: string[];
  correctAnswer: string;
};

const initialQuestions: Question[] = [
    { id: "Q001", text: "What is the capital of France?", subject: "General Knowledge", standard: "10th", options: ["Berlin", "Madrid", "Paris", "Rome"], correctAnswer: "Paris" },
    { id: "Q002", text: "What is 2 + 2?", subject: "Mathematics", standard: "10th", options: ["3", "4", "5", "6"], correctAnswer: "4" },
    { id: "Q003", text: "Which gas is most abundant in the Earth's atmosphere?", subject: "Science", standard: "11th", options: ["Oxygen", "Hydrogen", "Nitrogen", "Carbon Dioxide"], correctAnswer: "Nitrogen" },
];

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newQuestion: Question = {
        id: editingQuestion ? editingQuestion.id : `Q${String(Date.now()).slice(-3)}`,
        text: formData.get("text") as string,
        subject: formData.get("subject") as string,
        standard: formData.get("standard") as string,
        options: [
            formData.get("option1") as string,
            formData.get("option2") as string,
            formData.get("option3") as string,
            formData.get("option4") as string,
        ],
        correctAnswer: formData.get("correctAnswer") as string,
    };

    if (editingQuestion) {
        setQuestions(questions.map(q => q.id === newQuestion.id ? newQuestion : q));
         toast({ title: "Question Updated!", description: "The question has been updated in the bank." });
    } else {
        setQuestions([...questions, newQuestion]);
        toast({ title: "Question Added!", description: "The new question has been added to the bank." });
    }

    setIsFormOpen(false);
    setEditingQuestion(null);
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  }
  
  const handleDelete = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    toast({ title: "Question Deleted", description: "The question has been removed from the bank."});
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><FileQuestion /> Question Bank Management</h1>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Questions</CardTitle>
                <CardDescription>
                    Add, edit, or remove questions for the mock tests.
                </CardDescription>
              </div>
              <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                  setIsFormOpen(isOpen);
                  if (!isOpen) setEditingQuestion(null);
              }}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Question
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the MCQ.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="text">Question Text</Label>
                            <Textarea id="text" name="text" required defaultValue={editingQuestion?.text}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="standard">Academic Standard</Label>
                                 <Select name="standard" required defaultValue={editingQuestion?.standard}>
                                    <SelectTrigger id="standard"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {[...Array(12)].map((_, i) => <SelectItem key={i+1} value={`${i+1}th`}>{i+1}th</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                 <Select name="subject" required defaultValue={editingQuestion?.subject}>
                                    <SelectTrigger id="subject"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General Knowledge">General Knowledge</SelectItem>
                                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                                        <SelectItem value="Science">Science</SelectItem>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="History">History</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="option1">Option 1</Label>
                                <Input id="option1" name="option1" required defaultValue={editingQuestion?.options[0]}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="option2">Option 2</Label>
                                <Input id="option2" name="option2" required defaultValue={editingQuestion?.options[1]}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="option3">Option 3</Label>
                                <Input id="option3" name="option3" required defaultValue={editingQuestion?.options[2]}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="option4">Option 4</Label>
                                <Input id="option4" name="option4" required defaultValue={editingQuestion?.options[3]}/>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="correctAnswer">Correct Answer</Label>
                            <Select name="correctAnswer" required defaultValue={editingQuestion?.correctAnswer}>
                                <SelectTrigger id="correctAnswer">
                                    <SelectValue placeholder="Select the correct option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={(document.querySelector('input[name="option1"]') as HTMLInputElement)?.value}>Option 1</SelectItem>
                                    <SelectItem value={(document.querySelector('input[name="option2"]') as HTMLInputElement)?.value}>Option 2</SelectItem>
                                    <SelectItem value={(document.querySelector('input[name="option3"]') as HTMLInputElement)?.value}>Option 3</SelectItem>
                                    <SelectItem value={(document.querySelector('input[name="option4"]') as HTMLInputElement)?.value}>Option 4</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>

                        <DialogFooter>
                            <Button type="submit">{editingQuestion ? 'Save Changes' : 'Add Question'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
              </Dialog>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Question</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length > 0 ? questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium truncate max-w-sm">{q.text}</TableCell>
                  <TableCell>{q.subject}</TableCell>
                  <TableCell>{q.standard}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(q)}>
                            <Edit className="mr-2 h-4 w-4"/> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-500 focus:bg-red-950/50" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No questions in the bank yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

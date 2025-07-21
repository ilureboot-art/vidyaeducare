
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
import { allQuestions, type Question } from "@/lib/question-bank";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(allQuestions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [option1En, setOption1En] = useState("");
  const [option2En, setOption2En] = useState("");
  const [option3En, setOption3En] = useState("");
  const [option4En, setOption4En] = useState("");
  const { toast } = useToast();
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const optionsEn = [
        formData.get("option1.en") as string,
        formData.get("option2.en") as string,
        formData.get("option3.en") as string,
        formData.get("option4.en") as string,
    ];
    const optionsHi = [
        formData.get("option1.hi") as string,
        formData.get("option2.hi") as string,
        formData.get("option3.hi") as string,
        formData.get("option4.hi") as string,
    ];
    
    const correctAnsEn = formData.get("correctAnswer.en") as string;
    const correctAnsIndex = optionsEn.indexOf(correctAnsEn);
    const correctAnsHi = optionsHi[correctAnsIndex];

    const newQuestionData: Question = {
        id: editingQuestion ? editingQuestion.id : `Q${String(Date.now()).slice(-3)}`,
        text: {
            en: formData.get("text.en") as string,
            hi: formData.get("text.hi") as string
        },
        subject: formData.get("subject") as string,
        standard: formData.get("standard") as string,
        options: {
            en: optionsEn,
            hi: optionsHi
        },
        correctAnswer: {
            en: correctAnsEn,
            hi: correctAnsHi,
        },
    };

    if (editingQuestion) {
        const updatedQuestions = questions.map(q => q.id === newQuestionData.id ? newQuestionData : q);
        setQuestions(updatedQuestions);
        // In a real app, this would be an API call to update the central store
        const indexToUpdate = allQuestions.findIndex(q => q.id === newQuestionData.id);
        if (indexToUpdate > -1) {
            allQuestions[indexToUpdate] = newQuestionData;
        }
         toast({ title: "Question Updated!", description: "The question has been updated in the bank." });
    } else {
        setQuestions([...questions, newQuestionData]);
        // In a real app, this would be an API call to update the central store
        allQuestions.push(newQuestionData);
        toast({ title: "Question Added!", description: "The new question has been added to the bank." });
    }

    setIsFormOpen(false);
    setEditingQuestion(null);
  }

  const handleEdit = (question: Question) => {
    setOption1En(question.options.en[0]);
    setOption2En(question.options.en[1]);
    setOption3En(question.options.en[2]);
    setOption4En(question.options.en[3]);
    setEditingQuestion(question);
    setIsFormOpen(true);
  }
  
  const handleDelete = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    // In a real app, this would be an API call to update the central store
    const indexToDelete = allQuestions.findIndex(q => q.id === questionId);
    if (indexToDelete > -1) {
        allQuestions.splice(indexToDelete, 1);
    }
    toast({ title: "Question Deleted", description: "The question has been removed from the bank."});
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      setEditingQuestion(null);
      setOption1En("");
      setOption2En("");
      setOption3En("");
      setOption4En("");
    }
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
              <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Question
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[725px]">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the MCQ in both languages.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <Tabs defaultValue="en" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="en">English</TabsTrigger>
                                <TabsTrigger value="hi">Hindi</TabsTrigger>
                            </TabsList>
                            <TabsContent value="en" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="text.en">Question Text (English)</Label>
                                    <Textarea id="text.en" name="text.en" required defaultValue={editingQuestion?.text.en}/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="option1.en">Option 1</Label><Input id="option1.en" name="option1.en" required defaultValue={editingQuestion?.options.en[0]} onChange={e => setOption1En(e.target.value)}/></div>
                                    <div className="space-y-2"><Label htmlFor="option2.en">Option 2</Label><Input id="option2.en" name="option2.en" required defaultValue={editingQuestion?.options.en[1]} onChange={e => setOption2En(e.target.value)}/></div>
                                    <div className="space-y-2"><Label htmlFor="option3.en">Option 3</Label><Input id="option3.en" name="option3.en" required defaultValue={editingQuestion?.options.en[2]} onChange={e => setOption3En(e.target.value)}/></div>
                                    <div className="space-y-2"><Label htmlFor="option4.en">Option 4</Label><Input id="option4.en" name="option4.en" required defaultValue={editingQuestion?.options.en[3]} onChange={e => setOption4En(e.target.value)}/></div>
                                </div>
                            </TabsContent>
                             <TabsContent value="hi" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="text.hi">Question Text (Hindi)</Label>
                                    <Textarea id="text.hi" name="text.hi" required defaultValue={editingQuestion?.text.hi}/>
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="option1.hi">Option 1</Label><Input id="option1.hi" name="option1.hi" required defaultValue={editingQuestion?.options.hi[0]} /></div>
                                    <div className="space-y-2"><Label htmlFor="option2.hi">Option 2</Label><Input id="option2.hi" name="option2.hi" required defaultValue={editingQuestion?.options.hi[1]} /></div>
                                    <div className="space-y-2"><Label htmlFor="option3.hi">Option 3</Label><Input id="option3.hi" name="option3.hi" required defaultValue={editingQuestion?.options.hi[2]} /></div>
                                    <div className="space-y-2"><Label htmlFor="option4.hi">Option 4</Label><Input id="option4.hi" name="option4.hi" required defaultValue={editingQuestion?.options.hi[3]} /></div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
                         <div className="space-y-2">
                            <Label htmlFor="correctAnswer.en">Correct Answer (Select the English option)</Label>
                            <Select name="correctAnswer.en" required defaultValue={editingQuestion?.correctAnswer.en}>
                                <SelectTrigger id="correctAnswer.en">
                                    <SelectValue placeholder="Select the correct option" />
                                </SelectTrigger>
                                <SelectContent>
                                    {option1En && <SelectItem value={option1En}>{option1En}</SelectItem>}
                                    {option2En && <SelectItem value={option2En}>{option2En}</SelectItem>}
                                    {option3En && <SelectItem value={option3En}>{option3En}</SelectItem>}
                                    {option4En && <SelectItem value={option4En}>{option4En}</SelectItem>}
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
                <TableHead className="w-[60%]">Question (English)</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length > 0 ? questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium truncate max-w-sm">{q.text.en}</TableCell>
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

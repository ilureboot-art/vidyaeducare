
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
import { FileQuestion, MoreHorizontal, PlusCircle, Trash2, Edit, Upload } from "lucide-react";
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
import { academicConfig } from "@/lib/academic-config";


export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(allQuestions);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [option1En, setOption1En] = useState("");
  const [option2En, setOption2En] = useState("");
  const [option3En, setOption3En] = useState("");
  const [option4En, setOption4En] = useState("");
  const { toast } = useToast();
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // State for bulk upload dropdowns
  const [bulkBoard, setBulkBoard] = useState<Question['board'] | ''>('');
  const [bulkStandard, setBulkStandard] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  
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
    const optionsMr = [
        formData.get("option1.mr") as string,
        formData.get("option2.mr") as string,
        formData.get("option3.mr") as string,
        formData.get("option4.mr") as string,
    ];
    
    const correctAnsEn = formData.get("correctAnswer.en") as string;
    const correctAnsIndex = optionsEn.indexOf(correctAnsEn);
    const correctAnsMr = optionsMr[correctAnsIndex];

    const newQuestionData: Question = {
        id: editingQuestion ? editingQuestion.id : `Q${String(Date.now()).slice(-3)}`,
        text: {
            en: formData.get("text.en") as string,
            mr: formData.get("text.mr") as string
        },
        subject: formData.get("subject") as string,
        standard: formData.get("standard") as string,
        board: formData.get("board") as "CBSE" | "ICSE" | "SSC",
        options: {
            en: optionsEn,
            mr: optionsMr
        },
        correctAnswer: {
            en: correctAnsEn,
            mr: correctAnsMr,
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

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!bulkBoard || !bulkStandard || !bulkSubject) {
        toast({
            variant: 'destructive',
            title: "Information Missing",
            description: "Please select the board, standard, and subject before uploading a file.",
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') throw new Error("File content is not readable.");
            
            const parsedQuestions: Omit<Question, 'id' | 'board' | 'standard' | 'subject'>[] = JSON.parse(content);

            if (!Array.isArray(parsedQuestions)) {
                 throw new Error("JSON must be an array of questions.");
            }

            const newQuestions: Question[] = parsedQuestions.map(q => {
                 if (!q.text?.en || !q.options?.en || !q.correctAnswer?.en || !q.text?.mr || !q.options?.mr || !q.correctAnswer?.mr) {
                    throw new Error("One or more questions are missing required fields (text, options, correctAnswer in both languages).");
                 }
                return { 
                    ...q, 
                    id: `Q${String(Date.now()).slice(-6)}-${Math.random()}`,
                    board: bulkBoard as Question['board'],
                    standard: bulkStandard,
                    subject: bulkSubject,
                };
            });

            allQuestions.push(...newQuestions);
            setQuestions([...allQuestions]);
            toast({
                title: "Bulk Upload Successful!",
                description: `${newQuestions.length} new questions have been added for ${bulkSubject}, ${bulkStandard}, ${bulkBoard}.`
            });
            setIsBulkUploadOpen(false);

        } catch (error) {
            console.error("Bulk upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
             toast({
                variant: 'destructive',
                title: "Upload Failed",
                description: `Failed to parse JSON file. Please check the format. ${errorMessage}`,
             });
        }
    };
    reader.readAsText(file);
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
              <div className="flex gap-2">
                <Dialog open={isBulkUploadOpen} onOpenChange={(isOpen) => {
                    setIsBulkUploadOpen(isOpen);
                    if (!isOpen) {
                        setBulkBoard('');
                        setBulkStandard('');
                        setBulkSubject('');
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Bulk Upload Questions</DialogTitle>
                            <DialogDescription>
                                First, select the board, standard, and subject. Then, upload a JSON file with your questions. These selections will be applied to all questions in the file.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bulk-board">Board</Label>
                                    <Select name="bulk-board" value={bulkBoard} onValueChange={(val) => setBulkBoard(val as Question['board'])} required>
                                        <SelectTrigger id="bulk-board"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {academicConfig.boards.map(board => <SelectItem key={board} value={board}>{board}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bulk-standard">Standard</Label>
                                    <Select name="bulk-standard" value={bulkStandard} onValueChange={setBulkStandard} required>
                                        <SelectTrigger id="bulk-standard"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {academicConfig.standards.map(std => <SelectItem key={std} value={std}>{std}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bulk-subject">Subject</Label>
                                    <Select name="bulk-subject" value={bulkSubject} onValueChange={setBulkSubject} required>
                                        <SelectTrigger id="bulk-subject"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {academicConfig.subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label className="font-semibold">Required Simplified JSON Format:</Label>
                                <pre className="p-2 bg-muted text-xs rounded-md overflow-x-auto">
{`[
  {
    "text": { "en": "Q Text", "mr": "प्रश्न मजकूर" },
    "options": {
      "en": ["A", "B", "C", "D"],
      "mr": ["अ", "ब", "क", "ड"]
    },
    "correctAnswer": { "en": "A", "mr": "अ" }
  }
]`}
                                </pre>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="json-upload">JSON File</Label>
                                <Input id="json-upload" type="file" accept=".json" onChange={handleBulkUpload} disabled={!bulkBoard || !bulkStandard || !bulkSubject}/>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Question
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                            <DialogDescription>
                                Fill in the details for the MCQ in both languages.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <Tabs defaultValue="mr" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="mr">Marathi</TabsTrigger>
                                    <TabsTrigger value="en">English</TabsTrigger>
                                </TabsList>
                                <TabsContent value="mr" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="text.mr">Question Text (Marathi)</Label>
                                        <Textarea id="text.mr" name="text.mr" required defaultValue={editingQuestion?.text.mr}/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="option1.mr">Option 1</Label><Input id="option1.mr" name="option1.mr" required defaultValue={editingQuestion?.options.mr[0]} /></div>
                                        <div className="space-y-2"><Label htmlFor="option2.mr">Option 2</Label><Input id="option2.mr" name="option2.mr" required defaultValue={editingQuestion?.options.mr[1]} /></div>
                                        <div className="space-y-2"><Label htmlFor="option3.mr">Option 3</Label><Input id="option3.mr" name="option3.mr" required defaultValue={editingQuestion?.options.mr[2]} /></div>
                                        <div className="space-y-2"><Label htmlFor="option4.mr">Option 4</Label><Input id="option4.mr" name="option4.mr" required defaultValue={editingQuestion?.options.mr[3]} /></div>
                                    </div>
                                </TabsContent>
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
                            </Tabs>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="standard">Academic Standard</Label>
                                    <Select name="standard" required defaultValue={editingQuestion?.standard}>
                                        <SelectTrigger id="standard"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {academicConfig.standards.map(std => <SelectItem key={std} value={std}>{std}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Select name="subject" required defaultValue={editingQuestion?.subject}>
                                        <SelectTrigger id="subject"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {academicConfig.subjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="board">Education Board</Label>
                                     <Select name="board" required defaultValue={editingQuestion?.board}>
                                        <SelectTrigger id="board"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            {academicConfig.boards.map(board => <SelectItem key={board} value={board}>{board}</SelectItem>)}
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
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Question (English)</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length > 0 ? questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium truncate max-w-sm">{q.text.en}</TableCell>
                  <TableCell>{q.subject}</TableCell>
                  <TableCell>{q.standard}</TableCell>
                  <TableCell>{q.board}</TableCell>
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No questions in the bank yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

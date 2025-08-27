
"use client";

import React, { useState, useEffect } from "react";
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
import { MoreHorizontal, Trash2, Edit, Upload, BookCopy, FilePlus, ScrollText, ArrowRight, Save, Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { allTestSets, addTestSet, deleteTestSet, updateTestSet, type TestSet, type Question } from "@/lib/question-bank";
import { academicConfig } from "@/lib/academic-config";
import mammoth from "mammoth";
import { parseQuestionsFromText } from "@/ai/flows/question-parser-flow";


type ManualQuestion = Omit<Question, 'id'>;

const initialManualQuestion: ManualQuestion = {
  text: { en: '', mr: '' },
  options: { en: ['', '', '', ''], mr: ['', '', '', ''] },
  correctAnswer: { en: '', mr: '' }
};

export default function TestSetManagementPage() {
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const { toast } = useToast();
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [step, setStep] = useState(1);
  const [editingTestSet, setEditingTestSet] = useState<TestSet | null>(null);
  const [manualSetDetails, setManualSetDetails] = useState({ id: '', name: '', board: '', standard: '', subject: '' });
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([]);

  useEffect(() => {
    setTestSets([...allTestSets]);
  }, []);

  const resetManualForm = () => {
      setStep(1);
      setEditingTestSet(null);
      setManualSetDetails({ id: '', name: '', board: '', standard: '', subject: '' });
      setManualQuestions([]);
  };

  const handleOpenCreateDialog = () => {
    resetManualForm();
    setManualQuestions(Array(50).fill(0).map(() => JSON.parse(JSON.stringify(initialManualQuestion))));
    setIsManualCreateOpen(true);
  };

  const handleOpenEditDialog = (testSet: TestSet) => {
    resetManualForm();
    setEditingTestSet(testSet);
    setManualSetDetails({
        id: testSet.id,
        name: testSet.name,
        board: testSet.board,
        standard: testSet.standard,
        subject: testSet.subject,
    });
    const questionsToEdit = JSON.parse(JSON.stringify(testSet.questions));
    while (questionsToEdit.length < 50) {
        questionsToEdit.push(JSON.parse(JSON.stringify(initialManualQuestion)));
    }
    setManualQuestions(questionsToEdit.map(({ id, ...rest }: Question) => rest));
    setStep(1);
    setIsManualCreateOpen(true);
  };


  const handleDelete = (testSetId: string) => {
    deleteTestSet(testSetId);
    setTestSets(prevSets => prevSets.filter(ts => ts.id !== testSetId));
    toast({ title: "Test Set Deleted", description: "The test set has been removed from the bank."});
  }

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
        let uploadedSet: Omit<TestSet, 'id' | 'questions'> & { questions: Omit<Question, 'id'>[] };

        if (file.type === 'application/json') {
            const content = await file.text();
            uploadedSet = JSON.parse(content);
        } else if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const { value: text } = await mammoth.extractRawText({ arrayBuffer });
            
            if (!text.trim()) {
                throw new Error("The DOCX file appears to be empty or could not be read.");
            }
            
            toast({ title: "Parsing Document...", description: "The AI is analyzing your document. This may take a moment." });
            uploadedSet = await parseQuestionsFromText({ documentText: text });

        } else {
            throw new Error("Unsupported file type. Please upload a .json or .docx file.");
        }

        if (!uploadedSet.name || !uploadedSet.board || !uploadedSet.standard || !uploadedSet.subject || !Array.isArray(uploadedSet.questions)) {
            throw new Error("Processed data is missing required fields: name, board, standard, subject, or questions array.");
        }
        
        uploadedSet.questions.forEach((q: any, index: number) => {
             if (!q.text?.en || !q.options?.en || !q.correctAnswer?.en || !q.text?.mr || !q.options?.mr || !q.correctAnswer?.mr) {
                throw new Error(`Question at index ${index} is missing required fields (text, options, correctAnswer in both languages).`);
             }
        });

        const newTestSet: TestSet = { 
            ...uploadedSet, 
            id: `SET-${String(Date.now()).slice(-6)}-${Math.random()}`,
            questions: uploadedSet.questions.map((q, i) => ({ ...q, id: `Q-${i}`}))
        };
        
        addTestSet(newTestSet);
        setTestSets(prevSets => [...prevSets, newTestSet]);
        
        toast({
            title: "Test Set Uploaded!",
            description: `"${newTestSet.name}" with ${newTestSet.questions.length} questions has been successfully added.`
        });
        setIsBulkUploadOpen(false);

    } catch (error) {
        console.error("Bulk upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
         toast({
            variant: 'destructive',
            title: "Upload Failed",
            description: `Failed to process file. ${errorMessage}`,
            duration: 9000
         });
    } finally {
        setIsUploading(false);
        event.target.value = '';
    }
  }
  
  const handleManualSetDetailSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (manualSetDetails.name && manualSetDetails.board && manualSetDetails.standard && manualSetDetails.subject) {
          setStep(2);
      } else {
          toast({ variant: 'destructive', title: 'Missing Details', description: 'Please fill out all fields for the test set.'});
      }
  }

 const handleQuestionChange = (qIndex: number, field: 'text' | 'option' | 'answer', lang: 'en' | 'mr', value: string, optionIndex?: number) => {
    setManualQuestions(prevQuestions => {
        const newQuestions = [...prevQuestions];
        const updatedQuestion = JSON.parse(JSON.stringify(newQuestions[qIndex]));

        if (field === 'text') {
            updatedQuestion.text[lang] = value;
        } else if (field === 'option' && optionIndex !== undefined) {
            updatedQuestion.options[lang][optionIndex] = value;
        } else if (field === 'answer') {
            updatedQuestion.correctAnswer.mr = value;
            const selectedOptionIndex = updatedQuestion.options.mr.findIndex((opt: string) => opt === value);
            updatedQuestion.correctAnswer.en = selectedOptionIndex !== -1 ? updatedQuestion.options.en[selectedOptionIndex] : '';
        }
        newQuestions[qIndex] = updatedQuestion;
        return newQuestions;
    });
};

  
 const handleManualSubmit = () => {
    const finalQuestions = manualQuestions
        .filter(q => q.text.en?.trim() !== '' && q.text.mr?.trim() !== '')
        .map((q, i) => ({ ...q, id: `Q-${editingTestSet ? editingTestSet.id : 'NEW'}-${i}` }));

    if (finalQuestions.length === 0) {
        toast({ variant: 'destructive', title: 'No Questions Added', description: 'Please add at least one complete question.' });
        return;
    }

    const newTestSetData = {
        id: editingTestSet ? editingTestSet.id : `MSET-${Date.now()}`,
        name: manualSetDetails.name,
        board: manualSetDetails.board as any,
        standard: manualSetDetails.standard,
        subject: manualSetDetails.subject,
        questions: finalQuestions,
    };

    if (editingTestSet) {
        updateTestSet(newTestSetData);
        setTestSets(prev => prev.map(ts => ts.id === newTestSetData.id ? newTestSetData : ts));
    } else {
        addTestSet(newTestSetData);
        setTestSets(prev => [...prev, newTestSetData]);
    }
    
    toast({ title: editingTestSet ? 'Test Set Updated!' : 'Test Set Created!', description: `"${newTestSetData.name}" has been saved.` });
    setIsManualCreateOpen(false);
    resetManualForm();
};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><BookCopy /> Test Set Management</h1>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Test Sets</CardTitle>
                <CardDescription>
                    Create or upload sets of questions for mock tests.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                 <Dialog open={isManualCreateOpen} onOpenChange={(isOpen) => {
                      if (!isOpen) resetManualForm();
                      setIsManualCreateOpen(isOpen);
                  }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" onClick={handleOpenCreateDialog}><FilePlus className="mr-2 h-4 w-4" /> Create Manually</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[90vh]">
                        {step === 1 && (
                            <>
                            <DialogHeader>
                                <DialogTitle>{editingTestSet ? 'Edit Test Set Details' : 'Create New Test Set'} (Step 1 of 2)</DialogTitle>
                                <DialogDescription>First, provide the details for your new test set.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleManualSetDetailSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="manual-name">Test Set Name</Label>
                                    <Input id="manual-name" value={manualSetDetails.name} onChange={(e) => setManualSetDetails(s => ({...s, name: e.target.value}))} placeholder="e.g., SSC Science Final Practice" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="manual-board">Board</Label>
                                        <Select value={manualSetDetails.board} onValueChange={(val) => setManualSetDetails(s => ({...s, board: val}))}><SelectTrigger id="manual-board"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.boards.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="manual-standard">Standard</Label>
                                        <Select value={manualSetDetails.standard} onValueChange={(val) => setManualSetDetails(s => ({...s, standard: val}))}><SelectTrigger id="manual-standard"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.standards.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="manual-subject">Subject</Label>
                                        <Select value={manualSetDetails.subject} onValueChange={(val) => setManualSetDetails(s => ({...s, subject: val}))}><SelectTrigger id="manual-subject"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Next: Add Questions <ArrowRight className="ml-2"/></Button>
                                </DialogFooter>
                            </form>
                            </>
                        )}
                        {step === 2 && (
                             <>
                            <DialogHeader>
                                <DialogTitle>{editingTestSet ? 'Edit' : 'Add'} Questions (Step 2 of 2)</DialogTitle>
                                <DialogDescription>Enter questions for the "{manualSetDetails.name}" test set. You can save your progress and add more later.</DialogDescription>
                            </DialogHeader>
                             <ScrollArea className="h-full -mx-6 px-6">
                                <div className="space-y-4 py-4">
                                    {manualQuestions.map((q, qIndex) => (
                                        <div key={qIndex} className="p-4 border rounded-lg space-y-4 bg-muted/50">
                                            <h4 className="font-semibold flex items-center gap-2"><ScrollText size={16}/> Question {qIndex + 1}</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Question Text (Marathi)</Label>
                                                    <Textarea value={q.text.mr} onChange={(e) => handleQuestionChange(qIndex, 'text', 'mr', e.target.value)} />
                                                </div>
                                                 <div className="space-y-2">
                                                    <Label>Question Text (English)</Label>
                                                    <Textarea value={q.text.en} onChange={(e) => handleQuestionChange(qIndex, 'text', 'en', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                {[0,1,2,3].map(optIndex => (
                                                    <React.Fragment key={optIndex}>
                                                        <Input placeholder={`Option ${optIndex + 1} (Marathi)`} value={q.options.mr[optIndex] || ''} onChange={(e) => handleQuestionChange(qIndex, 'option', 'mr', e.target.value, optIndex)} />
                                                        <Input placeholder={`Option ${optIndex + 1} (English)`} value={q.options.en[optIndex] || ''} onChange={(e) => handleQuestionChange(qIndex, 'option', 'en', e.target.value, optIndex)} />
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Correct Answer (select the Marathi option)</Label>
                                                <Select value={q.correctAnswer.mr} onValueChange={(val) => handleQuestionChange(qIndex, 'answer', 'mr', val)}>
                                                    <SelectTrigger><SelectValue placeholder="Select correct answer..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {q.options.mr.map((opt, i) => (opt || '').trim() && <SelectItem key={i} value={opt}>{opt} / {q.options.en[i]}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </ScrollArea>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={handleManualSubmit}><Save className="mr-2 h-4 w-4"/>Save Test Set</Button>
                            </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                 </Dialog>

                <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                    <DialogTrigger asChild>
                        <Button><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Bulk Upload a Test Set</DialogTitle>
                            <DialogDescription>
                                Upload a JSON or DOCX file containing a test set. The AI will parse DOCX files automatically.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2 pt-4">
                                <Label className="font-semibold">Required JSON Format:</Label>
                                <pre className="p-2 bg-muted text-xs rounded-md overflow-x-auto">
{`{
  "name": "SSC Science Test #1",
  "board": "SSC",
  "standard": "10th",
  "subject": "Science",
  "questions": [
    {
      "text": { "en": "Q1 Text", "mr": "Q1 मजकूर" },
      "options": { "en": ["A","B","C","D"], "mr": ["अ","ब","क","ड"] },
      "correctAnswer": { "en": "A", "mr": "अ" }
    }
  ]
}`}
                                </pre>
                                <p className="text-sm text-muted-foreground">For DOCX files, just provide the questions, options, and answers in a clear list format.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="json-upload">Test Set File</Label>
                                <Input id="json-upload" type="file" accept=".json,.docx" onChange={handleBulkUpload} disabled={isUploading} />
                            </div>
                             {isUploading && (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    <span>Processing file...</span>
                                </div>
                             )}
                        </div>
                    </DialogContent>
                </Dialog>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Test Set Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Board</TableHead>
                 <TableHead>Questions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testSets.length > 0 ? testSets.map((ts) => (
                <TableRow key={ts.id}>
                  <TableCell className="font-medium">{ts.name}</TableCell>
                  <TableCell>{ts.subject}</TableCell>
                  <TableCell>{ts.standard}</TableCell>
                  <TableCell>{ts.board}</TableCell>
                  <TableCell>{ts.questions.length}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(ts)}>
                            <Edit className="mr-2 h-4 w-4"/> View/Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-500 focus:bg-red-950/50" onClick={() => handleDelete(ts.id)}>
                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">No test sets uploaded yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

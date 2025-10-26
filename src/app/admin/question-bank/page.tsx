
"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { MoreHorizontal, Trash2, Edit, Upload, BookCopy, FilePlus, ScrollText, ArrowRight, Save, Loader2, UploadCloud } from "lucide-react";
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
import { type TestSet, type Question, defaultTestSets } from "@/lib/question-bank";
import type { AcademicConfig } from "@/lib/academic-config";
import { defaultAcademicConfig } from "@/lib/academic-config";


const initialQuestionState: Omit<Question, 'id'> = {
  text: { en: '', mr: '' },
  options: { en: ['', '', '', ''], mr: ['', '', '', ''] },
  correctAnswer: { en: '', mr: '' }
};

const initialTestSetState: TestSet = {
  id: '',
  name: '',
  board: 'SSC',
  standard: '',
  subject: '',
  questions: [],
};

export default function TestSetManagementPage() {
  const { toast } = useToast();

  const [testSets, setLocalTestSets] = useState<TestSet[] | null>(null);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig | null>(null);

  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAppendDialogOpen, setIsAppendDialogOpen] = useState(false);
  const [testSetToAppend, setTestSetToAppend] = useState<TestSet | null>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [editingTestSet, setEditingTestSet] = useState<TestSet | null>(null);
  
  useEffect(() => {
    setLocalTestSets(defaultTestSets);
    setAcademicConfig(defaultAcademicConfig);
  }, []);

  const resetManualForm = () => {
      setStep(1);
      setEditingTestSet(null);
  };

  const handleOpenCreateDialog = () => {
    const newEmptyQuestions = Array(50).fill(null).map((_, i) => ({ ...JSON.parse(JSON.stringify(initialQuestionState)), id: `temp-${i}` }));
    setEditingTestSet({ ...initialTestSetState, id: `NEW-${Date.now()}`, questions: newEmptyQuestions });
    setStep(1);
    setIsManualCreateOpen(true);
  };

  const handleOpenEditDialog = (testSet: TestSet) => {
    const testSetCopy = JSON.parse(JSON.stringify(testSet));
    while (testSetCopy.questions.length < 50) {
        testSetCopy.questions.push({ ...JSON.parse(JSON.stringify(initialQuestionState)), id: `temp-${testSetCopy.questions.length}`});
    }
    setEditingTestSet(testSetCopy);
    setStep(1);
    setIsManualCreateOpen(true);
  };
  
  const handleOpenAppendDialog = (testSet: TestSet) => {
    setTestSetToAppend(testSet);
    setIsAppendDialogOpen(true);
  };


  const handleDelete = (testSetId: string) => {
    if (!testSets) return;
    const updatedTestSets = testSets.filter(ts => ts.id !== testSetId);
    setLocalTestSets(updatedTestSets);
    toast({ title: "Test Set Deleted", description: "The test set has been removed from the bank."});
  }
  
  const processAndSaveFile = async (file: File, existingTestSetId: string | null = null) => {
    setIsUploading(true);

    try {
        let parsedQuestionArray: Question[] = [];
        let inferredDetails: Omit<TestSet, 'id' | 'questions'> = { name: '', board: 'SSC', standard: '', subject: '' };
        
        if (file.type === 'application/json') {
            const content = await file.text();
            const jsonObj = JSON.parse(content);
            parsedQuestionArray = jsonObj.questions || [];
            if (!existingTestSetId) {
                inferredDetails = {
                    name: jsonObj.name || file.name.replace('.json', ''),
                    board: jsonObj.board || 'SSC',
                    standard: jsonObj.standard || '',
                    subject: jsonObj.subject || ''
                };
            }
        } else {
            throw new Error("Invalid File Type. Please upload a .json file.");
        }

        if (!parsedQuestionArray || parsedQuestionArray.length === 0) {
            throw new Error("No valid questions could be parsed from the document.");
        }
      
        const questionsWithIds = parsedQuestionArray.map((q, i) => ({ ...q, id: `Q-${Date.now()}-${i}`}));
        
        if (existingTestSetId) {
            if (!testSets) throw new Error("Test sets not loaded.");
            const existingSet = testSets.find(ts => ts.id === existingTestSetId);
            if (!existingSet) throw new Error("Could not find the test set to append to.");
            
            const existingQuestionTexts = new Set(existingSet.questions.map(q => q.text.en.trim()));
            const uniqueNewQuestions = questionsWithIds.filter(q => !existingQuestionTexts.has(q.text.en.trim()));
            const skippedCount = questionsWithIds.length - uniqueNewQuestions.length;

            const updatedSet = { ...existingSet, questions: [...existingSet.questions, ...uniqueNewQuestions] };
            const updatedTestSets = testSets.map(ts => ts.id === existingTestSetId ? updatedSet : ts);
            setLocalTestSets(updatedTestSets);

            toast({
              title: "Questions Appended!",
              description: `${uniqueNewQuestions.length} new questions added to "${existingSet.name}". ${skippedCount} duplicates were skipped.`
            });
        } else {
            const newTestSet: TestSet = {
                ...inferredDetails,
                id: `SET-${Date.now()}`,
                questions: questionsWithIds
            };
            setLocalTestSets([...(testSets || []), newTestSet]);
            toast({
              title: "Test Set Saved!",
              description: `"${newTestSet.name}" with ${newTestSet.questions.length} questions has been added.`
            });
        }
        
    } catch (error) {
        console.error("File processing error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
         toast({
            variant: 'destructive',
            title: "Upload Failed",
            description: `Failed to process file. ${errorMessage}`,
            duration: 9000
         });
    } finally {
        setIsUploading(false);
    }
  }

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsBulkUploadOpen(false);
    await processAndSaveFile(file);
    if (event.target) event.target.value = '';
  }
  
  const handleAppendUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !testSetToAppend) return;
      setIsAppendDialogOpen(false);
      await processAndSaveFile(file, testSetToAppend.id);
      if (event.target) event.target.value = '';
      setTestSetToAppend(null);
  };
  
  const handleSetDetailChange = (field: keyof Omit<TestSet, 'id'|'questions'>, value: string) => {
      if (!editingTestSet) return;
      setEditingTestSet({ ...editingTestSet, [field]: value });
  };
  
  const handleManualSetDetailSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingTestSet && editingTestSet.name && editingTestSet.board && editingTestSet.standard && editingTestSet.subject) {
          setStep(2);
      } else {
          toast({ variant: 'destructive', title: 'Missing Details', description: 'Please fill out all fields for the test set.'});
      }
  }

 const handleQuestionChange = (qIndex: number, field: 'text' | 'option' | 'answer', lang: 'en' | 'mr', value: string, optionIndex?: number) => {
    setEditingTestSet(currentTestSet => {
        if (!currentTestSet) return null;

        const newQuestions = currentTestSet.questions.map((q, index) => {
            if (index !== qIndex) {
                return q; 
            }

            const updatedQuestion = JSON.parse(JSON.stringify(q));

            if (field === 'text') {
                updatedQuestion.text[lang] = value;
            } else if (field === 'option' && optionIndex !== undefined) {
                updatedQuestion.options[lang][optionIndex] = value;
            } else if (field === 'answer') {
                updatedQuestion.correctAnswer[lang] = value;
                if (lang === 'mr') {
                    const selectedOptionIndex = updatedQuestion.options.mr.findIndex((opt: string) => opt === value);
                    if (selectedOptionIndex !== -1) {
                        updatedQuestion.correctAnswer.en = updatedQuestion.options.en[selectedOptionIndex];
                    } else {
                        updatedQuestion.correctAnswer.en = '';
                    }
                }
            }
            return updatedQuestion;
        });
        
        return { ...currentTestSet, questions: newQuestions };
    });
};

  
 const handleManualSubmit = () => {
    if (!editingTestSet || !testSets) return;

    const finalQuestions = editingTestSet.questions
        .filter(q => q.text.en?.trim() !== '' || q.text.mr?.trim() !== '')
        .map((q, i) => ({ ...q, id: q.id.startsWith('temp-') ? `Q-${editingTestSet.id}-${i}`: q.id }));

    if (finalQuestions.length === 0) {
        toast({ variant: 'destructive', title: 'No Questions Added', description: 'Please add at least one complete question.' });
        return;
    }
    
    const finalTestSetData: TestSet = {
        ...editingTestSet,
        questions: finalQuestions,
    };
    
    const isEditing = !finalTestSetData.id.startsWith("NEW-");

    if (isEditing) {
        const updatedTestSets = testSets.map(ts => ts.id === finalTestSetData.id ? finalTestSetData : ts);
        setLocalTestSets(updatedTestSets);
    } else {
        const newSetWithFinalId = {...finalTestSetData, id: `SET-${Date.now()}`};
        setLocalTestSets([...testSets, newSetWithFinalId]);
    }
    
    toast({ title: isEditing ? 'Test Set Updated!' : 'Test Set Created!', description: `"${finalTestSetData.name}" has been saved.` });
    
    setIsManualCreateOpen(false);
    resetManualForm();
};

  if (!testSets || !academicConfig) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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
                        {editingTestSet && step === 1 && (
                            <>
                            <DialogHeader>
                                <DialogTitle>{editingTestSet.id.startsWith('NEW-') ? 'Create New Test Set' : 'Edit Test Set Details'} (Step 1 of 2)</DialogTitle>
                                <DialogDescription>First, provide the details for your new test set.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleManualSetDetailSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="manual-name">Test Set Name</Label>
                                    <Input id="manual-name" value={editingTestSet.name} onChange={(e) => handleSetDetailChange('name', e.target.value)} placeholder="e.g., SSC Science Final Practice" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="manual-board">Board</Label>
                                        <Select value={editingTestSet.board} onValueChange={(val) => handleSetDetailChange('board', val as 'SSC' | 'CBSE' | 'ICSE')}><SelectTrigger id="manual-board"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.boards.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="manual-standard">Standard</Label>
                                        <Select value={editingTestSet.standard} onValueChange={(val) => handleSetDetailChange('standard', val)}><SelectTrigger id="manual-standard"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.standards.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="manual-subject">Subject</Label>
                                        <Select value={editingTestSet.subject} onValueChange={(val) => handleSetDetailChange('subject', val)}><SelectTrigger id="manual-subject"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.subjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Next: Add Questions <ArrowRight className="ml-2"/></Button>
                                </DialogFooter>
                            </form>
                            </>
                        )}
                        {editingTestSet && step === 2 && (
                             <>
                            <DialogHeader>
                                <DialogTitle>{editingTestSet.id.startsWith("NEW-") ? 'Add' : 'Edit'} Questions (Step 2 of 2)</DialogTitle>
                                <DialogDescription>Enter questions for the "{editingTestSet.name}" test set. You can save your progress and add more later.</DialogDescription>
                            </DialogHeader>
                             <ScrollArea className="h-full -mx-6 px-6">
                                <div className="space-y-4 py-4">
                                    {editingTestSet.questions.map((q, qIndex) => (
                                        <div key={q.id || `q-${qIndex}`} className="p-4 border rounded-lg space-y-4 bg-muted/50">
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
                            <DialogTitle>Bulk Upload a New Test Set</DialogTitle>
                            <DialogDescription>
                                This will create a brand new test set from your file.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                           <div className="space-y-2">
                               <Label className="font-semibold">JSON File Format:</Label>
                               <pre className="p-3 bg-muted text-xs rounded-md overflow-x-auto whitespace-pre-wrap">
{`{
  "name": "Test Name",
  "board": "SSC",
  "standard": "10th",
  "subject": "Science",
  "questions": [
    {
      "text": {"en": "Q Text", "mr": "Q Text"},
      "options": {"en": [], "mr": []},
      "correctAnswer": {"en": "Ans", "mr": "Ans"}
    }
  ]
}`}
                               </pre>
                           </div>
                             <div className="space-y-2">
                                <Label htmlFor="file-upload" className="font-semibold">Upload Your File (.json)</Label>
                                <Input id="file-upload" type="file" accept=".json" onChange={handleBulkUpload} disabled={isUploading} className="file:text-primary file:font-semibold" />
                                <p className="text-xs text-muted-foreground">The test set will be saved immediately after upload.</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                
                 {isUploading && (
                    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="animate-spin h-5 w-5" />
                            <span>Processing file... This may take a moment.</span>
                        </div>
                    </div>
                 )}

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
                        <DropdownMenuItem onClick={() => handleOpenAppendDialog(ts)}>
                            <UploadCloud className="mr-2 h-4 w-4" /> Upload & Append
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
      
      <Dialog open={isAppendDialogOpen} onOpenChange={setIsAppendDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Append Questions to "{testSetToAppend?.name}"</DialogTitle>
                  <DialogDescription>
                      Upload a JSON file. The questions inside will be added to the end of this test set.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label htmlFor="append-file-upload">File to Upload</Label>
                  <Input 
                      id="append-file-upload" 
                      type="file" 
                      ref={appendFileInputRef}
                      onChange={handleAppendUpload}
                      accept=".json" 
                      disabled={isUploading} 
                      className="file:text-primary file:font-semibold" 
                  />
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}

    

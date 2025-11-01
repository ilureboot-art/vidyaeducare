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
import { MoreHorizontal, Trash2, Edit, BookCopy, FilePlus, ScrollText, ArrowRight, Save, Loader2 } from "lucide-react";
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

  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);

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

  const handleDelete = (testSetId: string) => {
    if (!testSets) return;
    const updatedTestSets = testSets.filter(ts => ts.id !== testSetId);
    setLocalTestSets(updatedTestSets);
    toast({ title: "Test Set Deleted", description: "The test set has been removed from the bank."});
  }
  
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
                    Create or manage sets of questions for mock tests.
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
                 <Button disabled title="This feature is temporarily unavailable.">AI Generate (Temporarily Disabled)</Button>
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

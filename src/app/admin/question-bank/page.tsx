
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, BookCopy, FilePlus, ScrollText, ArrowRight, Save, Loader2, Upload, Wand2, Download, Info, Search, FilterX, AlertCircle, AlertTriangle } from "lucide-react";
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
import { type TestSet, type Question } from "@/lib/question-bank";
import { type AcademicConfig, defaultAcademicConfig } from "@/lib/academic-config";
import { useDb } from "@/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import Papa from "papaparse";
import { generateQuestions, type GenerateQuestionsInput } from "@/ai/flows/generate-questions-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

const initialAiInputState: GenerateQuestionsInput = {
    topic: '',
    board: 'SSC',
    standard: '',
    subject: '',
    numQuestions: 10,
};

export default function TestSetManagementPage() {
  const { toast } = useToast();
  const db = useDb();
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [academicConfig, setAcademicConfig] = useState<AcademicConfig>(defaultAcademicConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [isAiGenerateOpen, setIsAiGenerateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [step, setStep] = useState(1);
  const [editingTestSet, setEditingTestSet] = useState<TestSet | null>(null);
  const [aiInput, setAiInput] = useState<GenerateQuestionsInput>(initialAiInputState);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [standardFilter, setStandardFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  
  const fetchPageData = useCallback(async () => {
      if (!db) return;
      setIsLoading(true);
      setError(null);
      
      try {
          // Fetch test sets
          const testSetsCollection = collection(db, "testSets");
          const testSetSnapshot = await getDocs(testSetsCollection);
          const testSetList = testSetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestSet));
          setTestSets(testSetList);

          // Fetch config
          const configRef = doc(db, "configs", 'academic');
          const configSnap = await getDoc(configRef);
          if (configSnap.exists()) {
              setAcademicConfig(configSnap.data() as AcademicConfig);
          }
      } catch (err: any) {
          console.error("Error fetching bank data:", err);
          setError("Failed to load question bank. This may be due to regional propagation delays.");
      } finally {
          setIsLoading(false);
      }
  }, [db]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const resetManualForm = () => {
      setStep(1);
      setEditingTestSet(null);
  };

  const handleOpenCreateDialog = () => {
    const newEmptyQuestions = Array(20).fill(null).map((_, i) => ({ ...JSON.parse(JSON.stringify(initialQuestionState)), id: `temp-${i}` }));
    setEditingTestSet({ ...initialTestSetState, id: `NEW-${Date.now()}`, questions: newEmptyQuestions });
    setStep(1);
    setIsManualCreateOpen(true);
  };

  const handleOpenEditDialog = (testSet: TestSet) => {
    const testSetCopy = JSON.parse(JSON.stringify(testSet));
    while (testSetCopy.questions.length < 20) {
        testSetCopy.questions.push({ ...JSON.parse(JSON.stringify(initialQuestionState)), id: `temp-${testSetCopy.questions.length}`});
    }
    setEditingTestSet(testSetCopy);
    setStep(1);
    setIsManualCreateOpen(true);
  };

  const handleDelete = async (testSetId: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "testSets", testSetId));
        fetchPageData();
        toast({ title: "Test Set Deleted", description: "The test set has been removed from the bank."});
    } catch(error) {
        console.error("Error deleting test set:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not delete the test set."});
    }
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

        const newQuestions = [...currentTestSet.questions];
        const updatedQuestion = { ...newQuestions[qIndex] };

        if (field === 'text') {
            updatedQuestion.text = { ...updatedQuestion.text, [lang]: value };
        } else if (field === 'option' && optionIndex !== undefined) {
            const newOptions = { ...updatedQuestion.options };
            const newLangOptions = [...newOptions[lang]];
            newLangOptions[optionIndex] = value;
            newOptions[lang] = newLangOptions;
            updatedQuestion.options = newOptions;
        } else if (field === 'answer') {
            updatedQuestion.correctAnswer = { ...updatedQuestion.correctAnswer, [lang]: value };
             if (lang === 'mr') {
                const selectedOptionIndex = updatedQuestion.options.mr.findIndex((opt: string) => opt === value);
                if (selectedOptionIndex !== -1) {
                    updatedQuestion.correctAnswer.en = updatedQuestion.options.en[selectedOptionIndex];
                } else {
                    updatedQuestion.correctAnswer.en = '';
                }
            }
        }
        newQuestions[qIndex] = updatedQuestion;
        return { ...currentTestSet, questions: newQuestions };
    });
};

 const handleManualSubmit = async () => {
    if (!editingTestSet || !db) return;

    const finalQuestions = editingTestSet.questions
        .filter(q => q.text.en?.trim() !== '' || q.text.mr?.trim() !== '')
        .map((q, i) => ({ ...q, id: q.id.startsWith('temp-') ? `Q-${editingTestSet.id.replace("NEW-", "")}-${i}`: q.id }));

    if (finalQuestions.length === 0) {
        toast({ variant: 'destructive', title: 'No Questions Added', description: 'Please add at least one complete question.' });
        return;
    }
    
    const isEditing = !editingTestSet.id.startsWith("NEW-");
    const docId = isEditing ? editingTestSet.id : `SET-${Date.now()}`;

    const finalTestSetData: TestSet = {
        ...editingTestSet,
        id: docId,
        questions: finalQuestions,
    };
    
    try {
        await setDoc(doc(db, "testSets", docId), finalTestSetData);
        fetchPageData();
        toast({ title: isEditing ? 'Test Set Updated!' : 'Test Set Created!', description: `"${finalTestSetData.name}" has been saved.` });
        
        setIsManualCreateOpen(false);
        resetManualForm();
    } catch(error) {
        console.error("Error saving test set:", error);
        toast({ variant: 'destructive', title: "Error", description: 'Could not save the test set.' });
    }
};

const handleAiInputChange = (field: keyof GenerateQuestionsInput, value: string | number) => {
    setAiInput(prev => ({...prev, [field]: value}));
};

const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.subject || !aiInput.standard) {
        toast({ variant: 'destructive', title: 'Missing Details', description: 'Please select a standard and subject.' });
        return;
    }
    setIsGenerating(true);

    try {
        const result = await generateQuestions(aiInput);
        const testSetName = `${aiInput.subject} - ${aiInput.topic}`;
        setEditingTestSet({
            id: `NEW-${Date.now()}`,
            name: testSetName,
            board: aiInput.board as TestSet['board'],
            standard: aiInput.standard,
            subject: aiInput.subject,
            questions: result.questions
        });
        setStep(2); 
        setIsAiGenerateOpen(false);
        setIsManualCreateOpen(true);
    } catch (error) {
        console.error("AI Generation failed:", error);
        toast({ variant: 'destructive', title: "AI Error", description: "Failed to generate questions. Please try again." });
    } finally {
        setIsGenerating(false);
    }
};

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: (results) => {
                const parsedQuestions: Question[] = results.data.map((row: any, index: number) => ({
                    id: `temp-upload-${index}`,
                    text: { en: row.question_en || '', mr: row.question_mr || '' },
                    options: {
                        en: [row.option1_en || '', row.option2_en || '', row.option3_en || '', row.option4_en || ''],
                        mr: [row.option1_mr || '', row.option2_mr || '', row.option3_mr || '', row.option4_mr || '']
                    },
                    correctAnswer: { en: row.correct_answer_en || '', mr: row.correct_answer_mr || '' }
                }));

                const newTestSet = { ...initialTestSetState, id: `NEW-UPLOAD-${Date.now()}`, questions: parsedQuestions, name: file.name.replace('.csv','') };
                setEditingTestSet(newTestSet);
                setIsUploadOpen(false);
                setStep(1);
                setIsManualCreateOpen(true);
                 toast({ title: 'File Processed', description: `${parsedQuestions.length} questions loaded. Review and save.` });
            },
            error: (error) => {
                 toast({ variant: 'destructive', title: 'CSV Error', description: error.message });
            }
        });
    } else {
        toast({ variant: 'destructive', title: 'Unsupported File Type', description: 'Please upload a CSV file.' });
    }
};

  const filteredTestSets = useMemo(() => {
    if (!testSets) return [];
    return testSets.filter(ts => {
      const matchesSearch = (ts.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBoard = boardFilter === "all" || ts.board === boardFilter;
      const matchesStandard = standardFilter === "all" || ts.standard === standardFilter;
      const matchesSubject = subjectFilter === "all" || ts.subject === subjectFilter;
      return matchesSearch && matchesBoard && matchesStandard && matchesSubject;
    });
  }, [testSets, searchTerm, boardFilter, standardFilter, subjectFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setBoardFilter("all");
    setStandardFilter("all");
    setSubjectFilter("all");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse font-medium">Syncing Question Bank...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookCopy /> Test Set Management</h1>
        {error && (
            <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="mr-1 h-3 w-3"/> Partial Sync Delay
            </Badge>
        )}
      </div>

      {error && (
          <Alert variant="destructive" className="bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Synchronization Warning</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}

      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Test Sets</CardTitle>
                <CardDescription>
                    Create or manage sets of questions for mock tests.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
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
                                <DialogDescription>Enter questions for the "{editingTestSet.name}" test set.</DialogDescription>
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

                 <Dialog open={isAiGenerateOpen} onOpenChange={setIsAiGenerateOpen}>
                     <DialogTrigger asChild>
                         <Button><Wand2 className="mr-2 h-4 w-4" /> AI Generate</Button>
                     </DialogTrigger>
                     <DialogContent>
                         <DialogHeader>
                             <DialogTitle>Generate Questions with AI</DialogTitle>
                             <DialogDescription>Let AI create a new test set for you based on a topic.</DialogDescription>
                         </DialogHeader>
                         <form onSubmit={handleAiGenerate} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ai-topic">Chapter Name / Topic</Label>
                                    <Input id="ai-topic" value={aiInput.topic} onChange={(e) => handleAiInputChange('topic', e.target.value)} placeholder="e.g., Gravitation" required/>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ai-board">Board</Label>
                                        <Select value={aiInput.board} onValueChange={(val) => handleAiInputChange('board', val)}><SelectTrigger id="ai-board"><SelectValue/></SelectTrigger><SelectContent>{academicConfig.boards.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ai-standard">Standard</Label>
                                        <Select value={aiInput.standard} onValueChange={(val) => handleAiInputChange('standard', val)} required><SelectTrigger id="ai-standard"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.standards.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="ai-subject">Subject</Label>
                                        <Select value={aiInput.subject} onValueChange={(val) => handleAiInputChange('subject', val)} required><SelectTrigger id="ai-subject"><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{academicConfig.subjects.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ai-numQuestions">Number of Questions</Label>
                                    <Input id="ai-numQuestions" type="number" value={aiInput.numQuestions} onChange={(e) => handleAiInputChange('numQuestions', Number(e.target.value))} min={1} max={50} required/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isGenerating}>
                                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generating...</> : 'Generate Questions'}
                                </Button>
                            </DialogFooter>
                         </form>
                     </DialogContent>
                 </Dialog>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Upload className="mr-2 h-4 w-4"/> Upload CSV</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                         <DialogHeader>
                             <DialogTitle>Upload MCQs from File</DialogTitle>
                             <DialogDescription>
                                 Upload a <strong>CSV UTF-8 (comma delimited)</strong> file to bulk-import Multiple Choice Questions.
                             </DialogDescription>
                         </DialogHeader>
                         <div className="space-y-6 py-4">
                            <div className="bg-muted/50 p-4 rounded-lg border border-dashed text-sm space-y-2">
                                <p className="font-bold flex items-center gap-2"><AlertCircle size={14} className="text-primary"/> Required Format:</p>
                                <ul className="list-disc list-inside text-[11px] space-y-1 text-muted-foreground pb-2">
                                    <li>File must be saved as <strong>CSV UTF-8 (Comma delimited)</strong>.</li>
                                    <li>Standard "CSV" files from Excel may break Marathi characters.</li>
                                    <li>Ensure headers match exactly as shown below.</li>
                                </ul>
                                <p className="font-bold text-[10px]">Expected CSV Headers:</p>
                                <code className="text-[10px] block bg-background p-2 rounded break-all">
                                    question_en, question_mr, option1_en, option1_mr, option2_en, option2_mr, option3_en, option3_mr, option4_en, option4_mr, correct_answer_en, correct_answer_mr
                                </code>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file-upload">Select CSV File</Label>
                                <Input id="file-upload" type="file" accept=".csv" onChange={handleFileUpload} />
                            </div>
                             <a href="/mcq_template.csv" download className="block">
                                <Button variant="link" className="p-0 h-auto text-primary">
                                    <Download className="mr-2 h-4 w-4" /> Download Formatting Template
                                </Button>
                            </a>
                         </div>
                    </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search test sets..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={boardFilter} onValueChange={setBoardFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Board" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Boards</SelectItem>
                  {academicConfig.boards.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={standardFilter} onValueChange={setStandardFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Standard" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Standards</SelectItem>
                  {academicConfig.standards.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {academicConfig.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" className="text-muted-foreground" onClick={clearFilters}>
                <FilterX className="mr-2 h-4 w-4" /> Reset
              </Button>
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
              {filteredTestSets.length > 0 ? filteredTestSets.map((ts) => (
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      {searchTerm || boardFilter !== "all" ? "No matches found for your filters." : "No test sets uploaded yet."}
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

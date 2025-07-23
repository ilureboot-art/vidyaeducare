
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
import { MoreHorizontal, Trash2, Edit, Upload, BookCopy } from "lucide-react";
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
import { allTestSets, addTestSet, deleteTestSet, type TestSet } from "@/lib/question-bank";

export default function TestSetManagementPage() {
  const [testSets, setTestSets] = useState<TestSet[]>(allTestSets);
  const { toast } = useToast();
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  
  const handleDelete = (testSetId: string) => {
    deleteTestSet(testSetId);
    setTestSets([...allTestSets]);
    toast({ title: "Test Set Deleted", description: "The test set has been removed from the bank."});
  }

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') throw new Error("File content is not readable.");
            
            const uploadedSet: Omit<TestSet, 'id' | 'questions'> & { questions: Omit<TestSet['questions'][0], 'id'>[] } = JSON.parse(content);

            if (!uploadedSet.name || !uploadedSet.board || !uploadedSet.standard || !uploadedSet.subject || !Array.isArray(uploadedSet.questions)) {
                throw new Error("JSON is missing required fields: name, board, standard, subject, or questions array.");
            }
            
            if (uploadedSet.questions.length !== 50) {
                 throw new Error(`The test set must contain exactly 50 questions. This file has ${uploadedSet.questions.length}.`);
            }

            // Basic validation for questions
            uploadedSet.questions.forEach((q, index) => {
                 if (!q.text?.en || !q.options?.en || !q.correctAnswer?.en || !q.text?.mr || !q.options?.mr || !q.correctAnswer?.mr) {
                    throw new Error(`Question at index ${index} is missing required fields (text, options, correctAnswer in both languages).`);
                 }
            });

            const newTestSet: TestSet = { 
                ...uploadedSet, 
                id: `SET-${String(Date.now()).slice(-6)}-${Math.random()}`,
                questions: uploadedSet.questions.map((q, i) => ({ ...q, id: `Q-${i}`})) // Add temporary IDs
            };
            
            addTestSet(newTestSet);
            setTestSets([...allTestSets]);
            
            toast({
                title: "Test Set Uploaded!",
                description: `"${newTestSet.name}" with 50 questions has been successfully added/updated.`
            });
            setIsBulkUploadOpen(false);

        } catch (error) {
            console.error("Bulk upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
             toast({
                variant: 'destructive',
                title: "Upload Failed",
                description: `Failed to parse JSON file. ${errorMessage}`,
                duration: 9000
             });
        }
    };
    reader.readAsText(file);
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
                    Upload and manage pre-defined sets of 50 questions for mock tests.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                    <DialogTrigger asChild>
                        <Button><Upload className="mr-2 h-4 w-4" /> Upload Test Set</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Upload a Test Set</DialogTitle>
                            <DialogDescription>
                                Upload a JSON file containing a named test set with exactly 50 questions.
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
    },
    // ...49 more questions
  ]
}`}
                                </pre>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="json-upload">Test Set JSON File</Label>
                                <Input id="json-upload" type="file" accept=".json" onChange={handleBulkUpload} />
                            </div>
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
                        <DropdownMenuItem disabled>
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


"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, BookOpen, Bell, Loader2, ArrowRight, X } from "lucide-react";
import { useDb, useAuth } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StudentProfile } from "@/lib/student-data";
import type { ScheduledTest } from "@/lib/test-schedule";
import type { AppNotification } from "@/lib/notifications";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<{
    students: StudentProfile[];
    tests: ScheduledTest[];
    notifications: AppNotification[];
  }>({ students: [], tests: [], notifications: [] });
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const db = useDb();

  useEffect(() => {
    if (!isOpen) {
      setQueryText("");
      setResults({ students: [], tests: [], notifications: [] });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!queryText || queryText.length < 2 || !db || !user) {
        setResults({ students: [], tests: [], notifications: [] });
        return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Search Students
        const studentsCol = collection(db, "students");
        const studentQ = query(studentsCol, where("parentId", "==", user.uid));
        const studentSnap = await getDocs(studentQ);
        const filteredStudents = studentSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as StudentProfile))
            .filter(s => s.name.toLowerCase().includes(queryText.toLowerCase()));

        // Search Tests
        const testsCol = collection(db, "scheduledTests");
        const testsSnap = await getDocs(testsCol);
        const filteredTests = testsSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as ScheduledTest))
            .filter(t => t.testSetName.toLowerCase().includes(queryText.toLowerCase()) || t.subject.toLowerCase().includes(queryText.toLowerCase()));

        // Search Notifications
        const notifsCol = collection(db, "notifications");
        const notifsQ = query(notifsCol, where("userId", "==", user.uid), orderBy("timestamp", "desc"), limit(20));
        const notifsSnap = await getDocs(notifsQ);
        const filteredNotifs = notifsSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as AppNotification))
            .filter(n => n.message.toLowerCase().includes(queryText.toLowerCase()));

        setResults({
          students: filteredStudents,
          tests: filteredTests,
          notifications: filteredNotifs
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [queryText, db, user, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
          <Search className="h-5 w-5" />
          <span className="sr-only">Global Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder="Search students, tests, or alerts..."
              className="pl-10 h-12 text-lg border-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/60"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              autoFocus
            />
            {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />}
            {queryText && !isLoading && (
                <button 
                    onClick={() => setQueryText("")} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-destructive transition-colors"
                >
                    <X size={16}/>
                </button>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 space-y-6">
            {queryText.length < 2 ? (
                <div className="text-center py-12 space-y-2 opacity-50">
                    <Search size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="font-bold">What are you looking for?</p>
                    <p className="text-[10px] uppercase tracking-widest font-black">Type at least 2 characters to search</p>
                </div>
            ) : (
                <>
                    {/* Students Results */}
                    {results.students.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Users size={12} className="text-primary"/> Students ({results.students.length})
                            </h3>
                            <div className="grid gap-2">
                                {results.students.map(s => (
                                    <Link key={s.id} href="/profile" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-primary/10 group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{s.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-sm font-bold group-hover:text-primary transition-colors">{s.name}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">{s.academic.standard} • {s.academic.board}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tests Results */}
                    {results.tests.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <BookOpen size={12} className="text-accent"/> Mock Tests ({results.tests.length})
                            </h3>
                            <div className="grid gap-2">
                                {results.tests.map(t => (
                                    <Link key={t.id} href="/test-schedule" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-accent/10 group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><BookOpen size={16}/></div>
                                            <div>
                                                <p className="text-sm font-bold group-hover:text-accent transition-colors">{t.testSetName}</p>
                                                <p className="text-[10px] font-medium text-muted-foreground">{t.subject} • {t.standard}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] font-black">{t.board}</Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notifications Results */}
                    {results.notifications.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Bell size={12} className="text-sky-500"/> Recent Alerts ({results.notifications.length})
                            </h3>
                            <div className="grid gap-2">
                                {results.notifications.map(n => (
                                    <div key={n.id} className="p-3 rounded-xl bg-muted/30 border border-transparent">
                                        <p className="text-xs font-bold leading-tight">{n.message}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{new Date(n.timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.students.length === 0 && results.tests.length === 0 && results.notifications.length === 0 && !isLoading && (
                        <div className="text-center py-12 opacity-50">
                            <p className="font-bold text-muted-foreground italic">No matches found for "{queryText}"</p>
                        </div>
                    )}
                </>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 bg-muted/50 border-t text-center">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Vidya EduCare AI Search Optimization</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

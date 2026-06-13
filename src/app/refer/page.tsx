
"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Share2, IndianRupee, Gift, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc, type Firestore } from "firebase/firestore";
import { useDb, useAuth } from "@/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

function ReferAndEarnPageContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const db = useDb();
    
    const [referralBonus, setReferralBonus] = useState<number | null>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchConfig = async () => {
            if (!db) return;
            const configRef = doc(db, "configs", "store");
            try {
                const storeConfigDoc = await getDoc(configRef).catch(async (e) => {
                    if (e.code === 'permission-denied') {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: configRef.path, operation: 'get' }));
                    }
                    throw e;
                });
                if(storeConfigDoc.exists()) {
                    setReferralBonus(storeConfigDoc.data().referralBonus);
                }
            } catch (e) {
                console.warn("Bonus config sync issue.");
            }
        };

        const fetchUserRefCode = async () => {
            if (user && db) {
                const walletDocRef = doc(db, "wallets", user.uid);
                try {
                    const walletDoc = await getDoc(walletDocRef).catch(async (e) => {
                        if (e.code === 'permission-denied') {
                            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: walletDocRef.path, operation: 'get' }));
                        }
                        throw e;
                    });
                    if (walletDoc.exists()) {
                        setReferralCode(walletDoc.data().referralCode);
                    } else {
                        setReferralCode(`REF${user.uid.slice(0,6).toUpperCase()}`);
                    }
                } catch (e) {
                    console.warn("Wallet code sync issue.");
                    setReferralCode(`REF${user.uid.slice(0,6).toUpperCase()}`);
                }
            }
        }
        
        if (db) {
            fetchConfig();
        }
        if (user && db) {
            fetchUserRefCode();
        }
    }, [user, db]);

  const handleShare = async () => {
    if (referralCode === null || referralBonus === null) return;
    const url = `${window.location.origin}/signup?ref=${referralCode}`;
    const faqUrl = `${window.location.origin}#faq`;
    const bonusAmount = referralBonus;
    
    const message = `🎁 Claim your Win-Win Bonus on Vidya EduCare! 🎁

I'm preparing for my exams and winning rewards with Vidya EduCare! Join me using my link and we BOTH get an instant ₹${bonusAmount} wallet bonus!

🚀 Excellence Tools for Students:
🏆 MockArena: Get paid for scoring! Top 5 scorers with 80%+ accuracy win cash.
🏁 Quiz Clash: Live tournaments with shared prize pools.
🤖 GuruAI: 24/7 personal bilingual tutor.
📝 QuickNotes: Instant structured summaries.

🔑 My Referral Code: ${referralCode}
🔗 Join & Get Bonus: ${url}

Learn more in our FAQ: ${faqUrl}

Let's succeed and earn together! 🎓✨`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    const fallbackCopy = () => {
        navigator.clipboard.writeText(message);
        toast({
            title: "Link Copied!",
            description: "Dynamic referral message copied to clipboard.",
        });
    };

    try {
        const newWindow = window.open(whatsappUrl, '_blank');
        if(!newWindow || newWindow.closed || typeof newWindow.closed=='undefined') {
            fallbackCopy();
        }
    } catch(e) {
        fallbackCopy();
    }
  };
    
    if (referralCode === null || referralBonus === null) {
        return (
          <div className="w-full max-w-2xl mx-auto flex items-center justify-center h-96">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Card className="shadow-2xl border-none ring-1 ring-primary/10 overflow-hidden">
                <CardHeader className="text-center bg-primary/[0.02] border-b pb-12 pt-12">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-primary/10 rounded-full animate-bounce">
                           <Share2 className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-black text-primary tracking-tighter uppercase italic">
                        REFER & EARN
                    </CardTitle>
                    <CardDescription className="text-lg font-bold text-muted-foreground mt-2">
                        Share academic success and get rewarded!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-primary/20 bg-primary/[0.02] relative overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest"><IndianRupee size={16}/> You Get</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-5xl font-black text-primary tracking-tighter">₹{referralBonus}</p>
                                <p className="text-[10px] font-black uppercase text-muted-foreground mt-2 tracking-widest">Successful Referral Credit</p>
                            </CardContent>
                        </Card>
                        <Card className="border-accent/20 bg-accent/[0.02] relative overflow-hidden">
                             <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-accent font-black text-sm uppercase tracking-widest"><Gift size={16}/> They Get</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-5xl font-black text-accent tracking-tighter">₹{referralBonus}</p>
                                <p className="text-[10px] font-black uppercase text-muted-foreground mt-2 tracking-widest">Instant Welcome Bonus</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="p-8 bg-muted/30 rounded-[2rem] border-2 border-dashed text-center space-y-4">
                        <h3 className="text-xl font-black text-primary uppercase italic">Your Referrer ID</h3>
                        <p className="text-4xl font-mono tracking-[0.3em] font-black">{referralCode}</p>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-2">
                            <CheckCircle2 size={14} className="text-green-500" />
                            Active & Ready for Sharing
                        </div>
                    </div>

                    <Button size="lg" className="w-full py-10 text-2xl font-black rounded-3xl shadow-xl hover:scale-[1.02] transition-transform group bg-primary hover:bg-primary/90" onClick={handleShare}>
                        <Share2 className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                        SHARE SUCCESS NOW
                    </Button>
                </CardContent>
                <CardFooter className="bg-primary/5 text-center justify-center p-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                        <Sparkles size={14} className="text-accent fill-accent" /> Build a learning community together
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function ReferAndEarnPage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <ReferAndEarnPageContent />
            </UserLayout>
        </ProtectedRoute>
    );
}

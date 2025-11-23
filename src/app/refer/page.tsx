
"use client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, IndianRupee, Gift, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc, type Firestore } from "firebase/firestore";
import { useDbService, useAuth } from "@/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";

function ReferAndEarnPageContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const db = useDbService();
    
    const [referralBonus, setReferralBonus] = useState<number | null>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchConfig = async () => {
            if (!db) return;
            const storeConfigDoc = await getDoc(doc(db, "configs", "store"));
            if(storeConfigDoc.exists()) {
                setReferralBonus(storeConfigDoc.data().referralBonus);
            }
        };

        const fetchUserRefCode = async () => {
            if (user && db) {
                const walletDoc = await getDoc(doc(db, "wallets", user.uid));
                if (walletDoc.exists()) {
                    setReferralCode(walletDoc.data().referralCode);
                } else {
                    setReferralCode(`REF${user.uid.slice(0,6).toUpperCase()}`);
                }
            }
        }
        
        if (db) {
            fetchConfig();
            fetchUserRefCode();
        }
    }, [user, db]);

    const handleShare = async () => {
        if (referralCode === null || referralBonus === null) return;
        const url = `${window.location.origin}/signup?ref=${referralCode}`;
        const bonusAmount = referralBonus;
        
        const message = `🎉 Join me on Vidya EduCare! Sign up with my code and we both get a ₹${bonusAmount} welcome bonus!

It's a great platform for mock tests and fun skill games where you can win cash prizes.

My Referral Code: ${referralCode}

Click here to join: ${url}`;
    
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

        const fallbackCopy = () => {
            navigator.clipboard.writeText(message);
            toast({
                title: "Link Copied!",
                description: "Promotional message copied to clipboard.",
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
        <div className="w-full max-w-2xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                        <Share2 /> Refer & Earn
                    </CardTitle>
                    <CardDescription>
                        Invite your friends and earn rewards together!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <div className="p-6 bg-muted rounded-lg">
                        <h3 className="text-xl font-bold">Share your referral code</h3>
                        <p className="text-muted-foreground mt-2">
                            When a friend signs up using your code, you both get a special bonus credited to your wallets.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-center gap-2 text-primary"><IndianRupee /> You Get</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">₹{referralBonus}</p>
                                <p className="text-xs text-muted-foreground">For each successful referral.</p>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center justify-center gap-2 text-primary"><Gift/> They Get</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">₹{referralBonus}</p>
                                <p className="text-xs text-muted-foreground">As an instant welcome bonus.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Button size="lg" className="w-full" onClick={handleShare}>
                        <Share2 className="mr-2" />
                        Share With Friends
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function ReferAndEarnPage() {
    return (
        <ProtectedRoute>
            <ReferAndEarnPageContent />
        </ProtectedRoute>
    );
}

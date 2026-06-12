
"use client";

import { useEffect, useRef } from 'react';
import { useAuth, useDb } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * A background observer that listens for changes in the user's transactions.
 * Triggers a toast notification when a 'Pending' transaction is approved or rejected.
 */
export function TransactionStatusObserver() {
    const { user } = useAuth();
    const db = useDb();
    const { toast } = useToast();
    
    // Track statuses to detect transitions
    const previousStatuses = useRef<Record<string, string>>({});
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (!user || !db) return;

        // Monitor transactions belonging to the current user
        const q = query(
            collection(db, "transactions"),
            where("user", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const currentStatuses: Record<string, string> = {};
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const id = doc.id;
                const status = data.status;
                currentStatuses[id] = status;

                // We only alert on transitions that happen AFTER the initial snapshot
                if (!isFirstRun.current) {
                    const prevStatus = previousStatuses.current[id];
                    
                    // Logic: Transition from 'Pending' to something else
                    if (prevStatus === 'Pending' && status !== 'Pending') {
                        if (status === 'Completed') {
                            toast({
                                title: "Transaction Approved!",
                                description: `Your request "${data.description}" of ₹${Math.abs(data.amount).toFixed(2)} has been successfully processed.`,
                            });
                        } else if (status === 'Rejected') {
                            toast({
                                variant: "destructive",
                                title: "Transaction Rejected",
                                description: `Your request "${data.description}" for ₹${Math.abs(data.amount).toFixed(2)} was not approved by the administrator.`,
                            });
                        }
                    }
                }
            });

            // Update cache for next snapshot comparison
            previousStatuses.current = currentStatuses;
            isFirstRun.current = false;
        }, (error) => {
            console.warn("Transaction observer restricted or offline.");
        });

        return () => unsubscribe();
    }, [user, db, toast]);

    return null;
}

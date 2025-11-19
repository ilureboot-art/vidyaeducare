
"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Users, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { db as dbPromise } from "@/lib/firebase";
import { collection, query, where, getDocs, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";

type ClientStatus = "Active" | "Expired";

type Client = {
  id: string;
  name: string;
  type: "Direct" | "Indirect";
  product: string;
  purchaseDate: string;
  validity: string;
  status: ClientStatus;
  expiresSoon?: boolean;
};

function StudentAccessPageContent() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const { user } = useAuth();
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    const initDb = async () => {
      const dbInstance = await dbPromise;
      setDb(dbInstance);
    };
    initDb();
  }, []);

  useEffect(() => {
    if (user && db) {
        const fetchClients = async () => {
            const q = query(collection(db, "clients"), where("referrerId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const clientList = querySnapshot.docs.map(doc => {
                const data = doc.data() as Omit<Client, 'id' | 'status' | 'expiresSoon'>;
                const validityDate = new Date(data.validity);
                const now = new Date();
                const status: ClientStatus = validityDate < now ? "Expired" : "Active";
                const daysUntilExpiry = (validityDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                const expiresSoon = status === "Active" && daysUntilExpiry <= 7;

                return {
                    id: doc.id,
                    ...data,
                    status,
                    expiresSoon
                } as Client;
            });
            setClients(clientList);
        };
        fetchClients();
    }
  }, [user, db]);

  if (!clients) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Link href="/iba/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to IBA Dashboard
          </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users/> Client List</CardTitle>
            <CardDescription>
              View the clients who have purchased products using your referral code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Client Type</TableHead>
                  <TableHead>Product Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? clients.map((client) => (
                  <TableRow key={client.id} className={client.expiresSoon ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <Badge variant={client.type === "Direct" ? "default" : "secondary"}>
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(client.validity), 'P')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={client.status === "Active" ? "default" : "destructive"} className={client.status === "Active" ? "bg-green-600" : "bg-red-600"}>
                          {client.status}
                        </Badge>
                        {client.expiresSoon && (
                           <Tooltip>
                              <TooltipTrigger>
                                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Subscription expires soon!</p>
                              </TooltipContent>
                            </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                        {client.expiresSoon && (
                            <Button variant="outline" size="sm">Remind to Renew</Button>
                        )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No client data found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}


export default function StudentAccessPage() {
    return (
        <ProtectedRoute>
            <TooltipProvider>
                <StudentAccessPageContent />
            </TooltipProvider>
        </ProtectedRoute>
    );
}

    

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
import { ArrowLeft, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

// In a real app, this data would be fetched from a database for the specific IBA
const initialClients: Client[] = [];


export default function StudentAccessPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const updatedClients = initialClients.map(client => {
      const expiryDate = new Date(client.validity);
      return {
        ...client,
        expiresSoon: client.status === "Active" && expiryDate <= thirtyDaysFromNow && expiryDate > today,
      };
    });
    setClients(updatedClients);
  }, []);

  return (
    <TooltipProvider>
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
                    <TableCell>{new Date(client.validity).toLocaleDateString()}</TableCell>
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
    </TooltipProvider>
  );
}

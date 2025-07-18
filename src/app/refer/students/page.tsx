
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

type ClientStatus = "Active" | "Expired";

type Client = {
  id: string;
  name: string;
  type: "Direct" | "Indirect";
  product: string;
  purchaseDate: string;
  validity: string;
  status: ClientStatus;
};

// In a real app, this data would be fetched from a database for the specific IBA
const initialClients: Client[] = [
    { id: "USR001", name: "Priya Sharma", type: "Direct", product: "1 Year Subscription", purchaseDate: "2024-07-01", validity: "2025-06-30", status: "Active" },
    { id: "USR002", name: "Ankit Gupta", type: "Direct", product: "6 Months Subscription", purchaseDate: "2024-03-15", validity: "2024-09-14", status: "Active" },
    { id: "USR003", name: "Sneha Reddy", type: "Indirect", product: "1 Year Subscription", purchaseDate: "2024-02-20", validity: "2025-02-19", status: "Active" },
    { id: "USR004", name: "Rahul Kumar", type: "Direct", product: "1 Year Subscription", purchaseDate: "2023-05-10", validity: "2024-05-09", status: "Expired" },
];

export default function StudentAccessPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
       <Link href="/refer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                   <TableCell>
                    <Badge variant={client.type === "Direct" ? "default" : "secondary"}>
                      {client.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.validity}</TableCell>
                  <TableCell>
                     <Badge variant={client.status === "Active" ? "default" : "destructive"} className={client.status === "Active" ? "bg-green-600" : "bg-red-600"}>
                      {client.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No client data found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

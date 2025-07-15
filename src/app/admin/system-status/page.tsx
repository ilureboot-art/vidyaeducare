
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Server, Database } from "lucide-react";

// Mock data for system status
const services = [
  { name: "Main API", status: "Operational", icon: Server },
  { name: "Database", status: "Operational", icon: Database },
  { name: "Genkit AI Service", status: "Operational", icon: Server },
  { name: "Payment Gateway", status: "Degraded Performance", icon: Server },
  { name: "Authentication Service", status: "Operational", icon: Server },
];

export default function SystemStatusPage() {
  const isAllOperational = services.every(s => s.status === "Operational");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Status</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-4 p-4 rounded-lg ${isAllOperational ? 'bg-green-100 dark:bg-green-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
            {isAllOperational ? <CheckCircle className="w-8 h-8 text-green-600"/> : <AlertTriangle className="w-8 h-8 text-yellow-600"/>}
            <p className={`text-xl font-semibold ${isAllOperational ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                {isAllOperational ? "All systems operational." : "Some systems are experiencing issues."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>Live status of all application microservices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.map((service, index) => {
            const isOperational = service.status === "Operational";
            const Icon = service.icon;
            return (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{service.name}</span>
                </div>
                <Badge variant={isOperational ? "default" : "destructive"} className={`${isOperational ? 'bg-green-600' : 'bg-yellow-500'} text-white`}>
                  {isOperational ? <CheckCircle className="mr-2 h-4 w-4" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                  {service.status}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

export type AdminRole = "Head Admin" | "Sub-admin";
export type AdminStatus = "Active" | "Pending" | "Rejected";

export type Admin = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  joinDate: string;
};

export type AdminData = {
    admins: Admin[];
    requests: Admin[];
}

export const defaultAdminData: AdminData = {
    admins: [
        { id: "ADM001", name: "Super Admin", email: "super@example.com", phone: "919999988888", role: "Head Admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-01T10:00:00.000Z" },
        { id: "ADM002", name: "Anil Kumar", email: "anil.k@example.com", phone: "919876543210", role: "Sub-admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-10T10:00:00.000Z" },
        { id: "ADM003", name: "Sanjay Gurav", email: "sanjay.g@example.com", phone: "919167992350", role: "Head Admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-01T10:00:00.000Z" },
    ],
    requests: [
        { id: "REQ001", name: "Sunita Patel", email: "sunita.p@example.com", phone: "918765432109", role: "Sub-admin" as AdminRole, status: "Pending" as AdminStatus, joinDate: "2024-07-28T10:00:00.000Z" },
    ]
};

    
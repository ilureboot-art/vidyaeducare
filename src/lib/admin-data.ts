
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


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

type AdminData = {
    admins: Admin[];
    requests: Admin[];
}

const defaultAdminData: AdminData = {
    admins: [
        { id: "ADM001", name: "Super Admin", email: "super@example.com", phone: "919999988888", role: "Head Admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-01" },
        { id: "ADM002", name: "Anil Kumar", email: "anil.k@example.com", phone: "919876543210", role: "Sub-admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-10" },
        { id: "ADM003", name: "Sanjay Gurav", email: "sanjay.g@example.com", phone: "919167992350", role: "Head Admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-01" },
    ],
    requests: [
        { id: "REQ001", name: "Sunita Patel", email: "sunita.p@example.com", phone: "918765432109", role: "Sub-admin" as AdminRole, status: "Pending" as AdminStatus, joinDate: "2024-07-28" },
    ]
};

export const getAdminData = (): AdminData => {
    if (typeof window === 'undefined') return JSON.parse(JSON.stringify(defaultAdminData)); // Return a deep copy for server-side
    const savedData = localStorage.getItem('adminData');
    return savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(defaultAdminData));
}

const saveAdminData = (data: AdminData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminData', JSON.stringify(data));
}

export function addAdmin(newAdmin: Omit<Admin, 'id' | 'joinDate' | 'status'>) {
    const adminData = getAdminData();
    const admin: Admin = {
        ...newAdmin,
        id: `ADM${String(Date.now()).slice(-4)}`,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
    };
    adminData.admins.push(admin);
    saveAdminData(adminData);
}

export function deleteAdmin(adminId: string) {
    let adminData = getAdminData();
    adminData.admins = adminData.admins.filter((admin: Admin) => admin.id !== adminId);
    saveAdminData(adminData);
}

export function updateAdmin(adminId: string, updatedDetails: Partial<Omit<Admin, 'id' | 'joinDate' | 'status'>>) {
    let adminData = getAdminData();
    const index = adminData.admins.findIndex((admin: Admin) => admin.id === adminId);
    if (index !== -1) {
        adminData.admins[index] = { ...adminData.admins[index], ...updatedDetails };
        saveAdminData(adminData);
    }
}

export function resetAdminPassword(adminId: string, newPassword: string) {
    // In a real app, this would make an API call to a secure backend.
    // For this prototype, we'll just log it and assume success.
    console.log(`Password for admin ${adminId} has been reset to: ${newPassword}`);
}

export function processRequest(requestId: string, newStatus: 'Active' | 'Rejected') {
    let adminData = getAdminData();
    const requestIndex = adminData.requests.findIndex((req: Admin) => req.id === requestId);
    if (requestIndex === -1) return;

    const requestToProcess = adminData.requests[requestIndex];
    adminData.requests.splice(requestIndex, 1);

    if (newStatus === 'Active') {
        const newAdmin: Admin = {
            ...requestToProcess,
            id: `ADM${String(Date.now()).slice(-4)}`,
            status: 'Active',
        };
        adminData.admins.push(newAdmin);
    }
    
    saveAdminData(adminData);
}

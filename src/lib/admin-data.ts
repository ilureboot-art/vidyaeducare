
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

let adminDataState: AdminData | null = null;

const initializeAdminData = (): AdminData => {
    if (typeof window === 'undefined') {
        return JSON.parse(JSON.stringify(defaultAdminData));
    }
    
    if (adminDataState !== null) {
        return adminDataState;
    }
    
    try {
        const savedData = localStorage.getItem('adminData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            adminDataState = parsedData;
            return parsedData;
        }
    } catch (e) {
        console.error("Failed to parse adminData from localStorage", e);
    }
    
    adminDataState = JSON.parse(JSON.stringify(defaultAdminData));
    localStorage.setItem('adminData', JSON.stringify(adminDataState));
    return adminDataState;
};

export const getAdminData = (): AdminData => {
    return initializeAdminData();
}

const saveAdminData = (data: AdminData) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('adminData', JSON.stringify(data));
        adminDataState = data;
    }
}

export function addAdmin(newAdmin: Omit<Admin, 'id' | 'joinDate' | 'status'>) {
    const currentAdminData = getAdminData();
    const admin: Admin = {
        ...newAdmin,
        id: `ADM${String(Date.now()).slice(-4)}`,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
    };
    currentAdminData.admins.push(admin);
    saveAdminData(currentAdminData);
}

export function deleteAdmin(adminId: string) {
    let currentAdminData = getAdminData();
    currentAdminData.admins = currentAdminData.admins.filter((admin: Admin) => admin.id !== adminId);
    saveAdminData(currentAdminData);
}

export function updateAdmin(adminId: string, updatedDetails: Partial<Omit<Admin, 'id' | 'joinDate' | 'status'>>) {
    let currentAdminData = getAdminData();
    const index = currentAdminData.admins.findIndex((admin: Admin) => admin.id === adminId);
    if (index !== -1) {
        currentAdminData.admins[index] = { ...currentAdminData.admins[index], ...updatedDetails };
        saveAdminData(currentAdminData);
    }
}

export function resetAdminPassword(adminId: string, newPassword: string) {
    console.log(`Password for admin ${adminId} has been reset to: ${newPassword}`);
}

export function processRequest(requestId: string, newStatus: 'Active' | 'Rejected') {
    let currentAdminData = getAdminData();
    const requestIndex = currentAdminData.requests.findIndex((req: Admin) => req.id === requestId);
    if (requestIndex === -1) return;

    const requestToProcess = currentAdminData.requests[requestIndex];
    currentAdminData.requests.splice(requestIndex, 1);

    if (newStatus === 'Active') {
        const newAdmin: Admin = {
            ...requestToProcess,
            id: `ADM${String(Date.now()).slice(-4)}`,
            status: 'Active',
        };
        currentAdminData.admins.push(newAdmin);
    }
    
    saveAdminData(currentAdminData);
}

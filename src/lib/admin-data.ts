
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

const defaultAdminData = {
    admins: [
        { id: "ADM001", name: "Super Admin", email: "super@example.com", phone: "919999988888", role: "Head Admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-01" },
        { id: "ADM002", name: "Anil Kumar", email: "anil.k@example.com", phone: "919876543210", role: "Sub-admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-10" },
        { id: "ADM003", name: "Sanjay Gurav", email: "sanjay.g@example.com", phone: "919167992350", role: "Head Admin" as AdminRole, status: "Active" as AdminStatus, joinDate: "2024-07-01" },
    ],
    requests: [
        { id: "REQ001", name: "Sunita Patel", email: "sunita.p@example.com", phone: "918765432109", role: "Sub-admin" as AdminRole, status: "Pending" as AdminStatus, joinDate: "2024-07-28" },
    ]
};

const getAdminData = () => {
    if (typeof window === 'undefined') return defaultAdminData;
    const savedData = localStorage.getItem('adminData');
    return savedData ? JSON.parse(savedData) : defaultAdminData;
}

const saveAdminData = (data: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminData', JSON.stringify(data));
}

export let adminData = getAdminData();

if (typeof window !== 'undefined') {
  adminData = getAdminData();
}

export function addAdmin(newAdmin: Omit<Admin, 'id' | 'joinDate' | 'status'>) {
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
    adminData.admins = adminData.admins.filter((admin: Admin) => admin.id !== adminId);
    saveAdminData(adminData);
}

export function processRequest(requestId: string, newStatus: 'Active' | 'Rejected') {
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

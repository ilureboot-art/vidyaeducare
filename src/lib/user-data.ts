
'use client';

export type Transaction = {
  id: number | string;
  type: 'deposit' | 'withdrawal';
  description: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  paymentMethod?: string;
  referenceId?: string;
  user?: string;
};

export type AdminPaymentMethods = {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId: string;
    gpayNumber: string;
    gpayUpiId: string;
    phonepeNumber: string;
    phonepeUpiId: string;
    qrCodeUrl: string;
};

export type WalletData = {
  balance: number;
  coins: number;
  referralCode: string;
  adminPaymentMethods: AdminPaymentMethods;
  transactions: Transaction[];
};

export const defaultWalletData: WalletData = {
    balance: 1500.00,
    coins: 250,
    referralCode: "ALEX-5D",
    adminPaymentMethods: {
        accountHolderName: "Vidya EduCare Pvt. Ltd.",
        accountNumber: "123456789012",
        ifscCode: "ABCD0001234",
        bankName: "EduBank",
        upiId: "vidya.educare@okbank",
        gpayNumber: "9876543210",
        gpayUpiId: "vidya.gpay@okbank",
        phonepeNumber: "9876543211",
        phonepeUpiId: "vidya.ppe@ybl",
        qrCodeUrl: "https://placehold.co/200x200.png?text=QR+Code",
    },
    transactions: [
        { id: 1, type: 'deposit', description: 'Welcome Bonus', amount: 50, date: '2024-07-20T10:00:00Z', status: 'Completed', user: 'Alex Doe' },
        { id: 2, type: 'withdrawal', description: 'Mock Test Subscription', amount: -299, date: '2024-07-21T11:30:00Z', status: 'Completed', user: 'Alex Doe' },
        { id: 3, type: 'deposit', description: 'Fund Deposit Request', amount: 500, date: '2024-07-25T09:00:00Z', status: 'Pending', referenceId: 'UPI-REF-12345', user: 'Alex Doe' },
        { id: 4, type: 'withdrawal', description: 'Withdrawal Request', amount: -200, date: '2024-07-26T15:00:00Z', status: 'Pending', paymentMethod: 'user@upi', user: 'Alex Doe' },
    ]
};

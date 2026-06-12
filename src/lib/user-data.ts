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
  receiptUrl?: string; // Data URI or URL for payment receipt image
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

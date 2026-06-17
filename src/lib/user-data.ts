'use client';

export type Transaction = {
  id: number | string;
  type: 'deposit' | 'withdrawal' | 'Purchase' | string;
  description: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  paymentMethod?: string;
  referenceId?: string;
  user?: string;
  receiptUrl?: string; // Data URI or URL for payment receipt image
  invoiceNumber?: string;
  basePrice?: number;
  discountDetails?: {
    base: number;
    referral: number;
    special: number;
    recommendation: number;
    totalPercentage: number;
    totalAmount: number;
  };
  taxableAmount?: number;
  gstRate?: number;
  gstAmount?: number;
  finalPrice?: number;
  billingDetails?: {
    name: string;
    email: string;
  };
  hsnSacCode?: string;
  packageName?: string;
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

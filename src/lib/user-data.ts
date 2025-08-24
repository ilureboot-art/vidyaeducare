
export type Transaction = {
  id: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  paymentMethod?: string;
  referenceId?: string;
  user?: string;
};

// This object acts as our in-memory, shared "database".
export const walletData: {
  balance: number;
  coins: number;
  referralCode: string;
  adminPaymentMethods: {
    upiId: string;
    gpayNumber: string;
    gpayUpiId: string;
    phonepeNumber: string;
    phonepeUpiId: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    qrCodeUrl: string;
  };
  transactions: Transaction[];
} = {
  balance: 0.00,
  coins: 100, // Starting coins for the user
  referralCode: "ALEX-D7F6E5C",
  adminPaymentMethods: {
    accountHolderName: "Sanjay Gurav (Founder/owner : Vidya Educare)",
    accountNumber: "123101501925",
    ifscCode: "icic0001200",
    bankName: "ICICI Bank",
    upiId: "sanjug123@icici",
    gpayNumber: "9167992350",
    gpayUpiId: "sanjaygurav0720@okicici",
    phonepeNumber: "9167992350",
    phonepeUpiId: "9167992350@ybl",
    qrCodeUrl: "", // Admin can upload this
  },
  transactions: [],
};

// Function to add a transaction to our shared state
export function addTransaction(transaction: Transaction) {
  walletData.transactions.unshift(transaction);
}

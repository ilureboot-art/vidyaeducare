
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
  adminPaymentMethods: {
    upiId: string;
    gpayNumber: string;
    phonepeNumber: string;
  };
  transactions: Transaction[];
} = {
  balance: 50.00,
  adminPaymentMethods: {
    upiId: "admin-upi@okhdfcbank",
    gpayNumber: "+91 98765 43210",
    phonepeNumber: "+91 98765 43210",
  },
  transactions: [],
};

// Function to add a transaction to our shared state
export function addTransaction(transaction: Transaction) {
  walletData.transactions.unshift(transaction);
}

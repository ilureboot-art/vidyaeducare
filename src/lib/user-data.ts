
export type Transaction = {
  id: number;
  type: 'deposit' | 'withdrawal';
  description: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  paymentMethod?: string;
  referenceId?: string;
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
  balance: 450.50,
  adminPaymentMethods: {
    upiId: "admin-upi@okhdfcbank",
    gpayNumber: "+91 98765 43210",
    phonepeNumber: "+91 98765 43210",
  },
  transactions: [
    { id: 1, type: "deposit", description: "Game Won Reward", amount: 75.00, date: "2024-07-29", status: "Completed" },
    { id: 2, type: "withdrawal", description: "Withdrawal Request", amount: -150.00, date: "2024-07-30", status: "Pending", paymentMethod: "user@upi" },
    { id: 3, type: "deposit", description: "Fund Deposit", amount: 100.00, date: "2024-07-29", status: "Completed", referenceId: "UPIREF12345" },
    { id: 4, type: "withdrawal", description: "Ticket Purchase (15)", amount: -25.00, date: "2024-07-27", status: "Completed" },
  ],
};

// Function to add a transaction to our shared state
export function addTransaction(transaction: Transaction) {
  walletData.transactions.unshift(transaction);
}

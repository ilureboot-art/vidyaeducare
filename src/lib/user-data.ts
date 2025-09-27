
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
  balance: 550.75,
  coins: 1250,
  referralCode: "ALEX-D7F6E5C",
  adminPaymentMethods: {
    accountHolderName: "Sanjay Gurav (Founder/owner : Vidya Educare)",
    accountNumber: "123101501925",
    ifscCode: "ICIC0001200",
    bankName: "ICICI Bank",
    upiId: "sanjug123@icici",
    gpayNumber: "9167992350",
gpayUpiId: "sanjaygurav0720@okicici",
    phonepeNumber: "9167992350",
    phonepeUpiId: "9167992350@ybl",
    qrCodeUrl: "https://placehold.co/200x200.png?text=QR+Code",
  },
  transactions: [
    { id: 1001, type: 'deposit', description: 'Welcome Bonus', amount: 50, date: '2024-07-01', status: 'Completed', user: 'Alex Doe' },
    { id: 1002, type: 'deposit', description: 'Fund Deposit', amount: 500, date: '2024-07-10', status: 'Completed', user: 'Alex Doe', referenceId: 'UPI-12345' },
    { id: 1003, type: 'withdrawal', description: '1 Year Subscription Purchase', amount: -3000, date: '2024-07-15', status: 'Completed', user: 'Alex Doe' },
    { id: 1004, type: 'withdrawal', description: 'Withdrawal Request', amount: -200, date: '2024-07-20', status: 'Pending', user: 'Alex Doe', paymentMethod: 'user@upi' },
    { id: 1005, type: 'deposit', description: 'Referral Bonus for Priya S.', amount: 5, date: '2024-07-22', status: 'Completed', user: 'Alex Doe' },
    { id: 1006, type: 'deposit', description: 'Game Win', amount: 100, date: '2024-07-25', status: 'Completed', user: 'Alex Doe' },
    { id: 1007, type: 'withdrawal', description: 'Withdrawal Request', amount: -500, date: '2024-07-28', status: 'Rejected', user: 'Alex Doe', paymentMethod: 'user@upi' },
  ],
};

// Function to add a transaction to our shared state
export function addTransaction(transaction: Transaction) {
  walletData.transactions.unshift(transaction);
}

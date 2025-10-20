
'use client';

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

const defaultWalletData: WalletData = {
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
    { id: 1001, type: 'deposit' as 'deposit', description: 'Welcome Bonus', amount: 50, date: '2024-07-01', status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1002, type: 'deposit' as 'deposit', description: 'Fund Deposit', amount: 500, date: '2024-07-10', status: 'Completed' as 'Completed', user: 'Alex Doe', referenceId: 'UPI-12345' },
    { id: 1003, type: 'withdrawal' as 'withdrawal', description: '1 Year Subscription Purchase', amount: -3000, date: '2024-07-15', status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1004, type: 'withdrawal' as 'withdrawal', description: 'Withdrawal Request', amount: -200, date: '2024-07-20', status: 'Pending' as 'Pending', user: 'Alex Doe', paymentMethod: 'user@upi' },
    { id: 1005, type: 'deposit' as 'deposit', description: 'Referral Bonus for Priya S.', amount: 5, date: '2024-07-22', status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1006, type: 'deposit' as 'deposit', description: 'Game Win', amount: 100, date: '2024-07-25', status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1007, type: 'withdrawal' as 'withdrawal', description: 'Withdrawal Request', amount: -500, date: '2024-07-28', status: 'Rejected' as 'Rejected', user: 'Alex Doe', paymentMethod: 'user@upi' },
  ],
};

export const getWalletData = (): WalletData => {
  if (typeof window === 'undefined') {
    return JSON.parse(JSON.stringify(defaultWalletData)); // Deep copy for server-side
  }
  const savedData = localStorage.getItem('walletData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error("Failed to parse walletData from localStorage", e);
      return JSON.parse(JSON.stringify(defaultWalletData));
    }
  }
  return JSON.parse(JSON.stringify(defaultWalletData));
};

const saveWalletData = (data: WalletData) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('walletData', JSON.stringify(data));
};

// Function to add a transaction to our shared state
export function addTransaction(transaction: Transaction) {
  let walletData = getWalletData();
  walletData.transactions.unshift(transaction);
  if (transaction.status === 'Completed') {
    if (transaction.type === 'deposit') {
      walletData.balance += transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      walletData.balance += transaction.amount; // amount is negative
    }
  }
  saveWalletData(walletData);
}

// Function to update transaction status
export function updateTransactionStatus(id: number, newStatus: 'Completed' | 'Rejected'): boolean {
    let walletData = getWalletData();
    const txIndex = walletData.transactions.findIndex((tx: Transaction) => tx.id === id);
    if (txIndex === -1) return false;

    const tx = walletData.transactions[txIndex];

    if (tx.status !== 'Pending') return false;

    if (tx.type === 'deposit' && newStatus === 'Completed') {
      walletData.balance += tx.amount;
    }
    
    if (tx.type === 'withdrawal' && newStatus === 'Rejected') {
        walletData.balance += Math.abs(tx.amount);
    }
    
    walletData.transactions[txIndex].status = newStatus;
    saveWalletData(walletData);
    return true;
}

export function setAdminPaymentMethods(methods: AdminPaymentMethods) {
  let walletData = getWalletData();
  walletData.adminPaymentMethods = methods;
  saveWalletData(walletData);
}

export function resetWalletData() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('walletData');
}

export function updateWalletBalance(newBalance: number) {
    let walletData = getWalletData();
    walletData.balance = newBalance;
    saveWalletData(walletData);
}

export function updateCoinBalance(newCoins: number) {
    let walletData = getWalletData();
    walletData.coins = newCoins;
    saveWalletData(walletData);
}

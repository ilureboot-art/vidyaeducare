
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
    { id: 1001, type: 'deposit' as 'deposit', description: 'Welcome Bonus', amount: 50, date: new Date().toISOString(), status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1002, type: 'deposit' as 'deposit', description: 'Fund Deposit', amount: 500, date: new Date().toISOString(), status: 'Completed' as 'Completed', user: 'Alex Doe', referenceId: 'UPI-12345' },
    { id: 1003, type: 'withdrawal' as 'withdrawal', description: '1 Year Subscription Purchase', amount: -3000, date: new Date().toISOString(), status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1004, type: 'withdrawal' as 'withdrawal', description: 'Withdrawal Request', amount: -200, date: new Date().toISOString(), status: 'Pending' as 'Pending', user: 'Alex Doe', paymentMethod: 'user@upi' },
    { id: 1005, type: 'deposit' as 'deposit', description: 'Referral Bonus for Priya S.', amount: 5, date: new Date().toISOString(), status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1006, type: 'deposit' as 'deposit', description: 'Game Win', amount: 100, date: new Date().toISOString(), status: 'Completed' as 'Completed', user: 'Alex Doe' },
    { id: 1007, type: 'withdrawal' as 'withdrawal', description: 'Withdrawal Request', amount: -500, date: new Date().toISOString(), status: 'Rejected' as 'Rejected', user: 'Alex Doe', paymentMethod: 'user@upi' },
  ],
};

let walletDataState: WalletData | null = null;

function initializeWalletData(): WalletData {
    // This function should only be called on the client side.
    if (walletDataState !== null) {
        return walletDataState;
    }
    
    const savedData = localStorage.getItem('walletData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData) {
                walletDataState = parsedData;
                return parsedData;
            }
        } catch (e) {
            console.error("Failed to parse walletData from localStorage", e);
        }
    }
    
    // Fallback to default if nothing in localStorage
    walletDataState = JSON.parse(JSON.stringify(defaultWalletData));
    localStorage.setItem('walletData', JSON.stringify(walletDataState));
    
    return walletDataState;
};

export function getWalletData(): WalletData {
    if (typeof window === 'undefined') {
        // Return a safe, default structure for server-side rendering
        return JSON.parse(JSON.stringify(defaultWalletData));
    }
    return initializeWalletData();
};

function saveWalletData(data: WalletData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('walletData', JSON.stringify(data));
    walletDataState = data;
  }
};

export function addTransaction(transaction: Transaction) {
  let data = getWalletData();
  data.transactions.unshift(transaction);
  if (transaction.status === 'Completed') {
    if (transaction.type === 'deposit') {
      data.balance += transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      data.balance += transaction.amount; 
    }
  }
  saveWalletData(data);
}

export function updateTransactionStatus(id: number, newStatus: 'Completed' | 'Rejected'): boolean {
    let data = getWalletData();
    const txIndex = data.transactions.findIndex((tx: Transaction) => tx.id === id);
    if (txIndex === -1) return false;

    const tx = data.transactions[txIndex];
    if (tx.status !== 'Pending') return false;

    if (tx.type === 'deposit' && newStatus === 'Completed') {
      data.balance += tx.amount;
    }
    
    if (tx.type === 'withdrawal' && newStatus === 'Rejected') {
        data.balance += Math.abs(tx.amount);
    }
    
    data.transactions[txIndex].status = newStatus;
    saveWalletData(data);
    return true;
}

export function setAdminPaymentMethods(methods: AdminPaymentMethods) {
  let data = getWalletData();
  data.adminPaymentMethods = methods;
  saveWalletData(data);
}

export function resetWalletData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletData');
    }
    walletDataState = null; 
}

export function updateWalletBalance(newBalance: number) {
    let data = getWalletData();
    data.balance = newBalance;
    saveWalletData(data);
}

export function updateCoinBalance(newCoins: number) {
    let data = getWalletData();
    data.coins = newCoins;
    saveWalletData(data);
}

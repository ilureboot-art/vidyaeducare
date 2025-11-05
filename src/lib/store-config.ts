
'use client';

export type TicketPackage = {
  tickets: number;
  price: number;
  bestValue: boolean;
  games: number;
  gstRate: number;
  hsnSacCode: string;
};

export type ReferboltSubscription = {
  name: string;
  price: number;
  description: string;
  ticketBonus: number;
  gstRate: number;
  hsnSacCode: string;
};

export type MockTestPackage = {
    name: string;
    price: number;
    months: number;
    bestValue: boolean;
    gstRate: number;
    hsnSacCode: string;
};

export type GameSettings = {
    maxAttempts: number;
    welcomeBonus: number;
    welcomeCoins: number;
    rewards: number[];
};

export type ReferboltSettings = {
    freeAccessWithMockTest: boolean;
    ibaBonusCommission: number;
};

export type StoreConfig = {
    packages: TicketPackage[];
    mockTestPackages: MockTestPackage[];
    referboltSubscription: ReferboltSubscription;
    referralBonus: number;
    gameSettings: GameSettings;
    referboltSettings: ReferboltSettings;
};

// This can remain as it is configuration, not user-specific data.
export const defaultStoreConfig: StoreConfig = {
    packages: [],
    
    mockTestPackages: [
        { name: "1 Year Subscription", price: 3000, months: 12, bestValue: true, gstRate: 18, hsnSacCode: '999294' },
        { name: "6 Months Subscription", price: 1500, months: 6, bestValue: false, gstRate: 18, hsnSacCode: '999294' },
    ],

    referboltSubscription: {
        name: "ReferBolt",
        price: 100,
        description: "Activate to earn commissions from an extended referral network.",
        ticketBonus: 0,
        gstRate: 18,
        hsnSacCode: '998314',
    },

    referralBonus: 5,
    
    gameSettings: {
        maxAttempts: 0,
        welcomeBonus: 0,
        welcomeCoins: 50,
        rewards: [],
    },
    
    referboltSettings: {
        freeAccessWithMockTest: true,
        ibaBonusCommission: 5,
    }
};

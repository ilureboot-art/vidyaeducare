
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

export const defaultStoreConfig: StoreConfig = {
    packages: [
        { tickets: 1, price: 25, bestValue: false, games: 2, gstRate: 28, hsnSacCode: '998439' },
        { tickets: 5, price: 120, bestValue: false, games: 10, gstRate: 28, hsnSacCode: '998439' },
        { tickets: 10, price: 225, bestValue: true, games: 20, gstRate: 28, hsnSacCode: '998439' },
    ],
    
    mockTestPackages: [
        { name: "1 Year Subscription", price: 3000, months: 12, bestValue: true, gstRate: 18, hsnSacCode: '999294' },
        { name: "6 Months Subscription", price: 1500, months: 6, bestValue: false, gstRate: 18, hsnSacCode: '999294' },
    ],

    referboltSubscription: {
        name: "ReferBolt",
        price: 100,
        description: "Activate to earn commissions and get a bonus of 4 tickets (worth 8 games).",
        ticketBonus: 4,
        gstRate: 18,
        hsnSacCode: '998314',
    },

    referralBonus: 5,
    
    gameSettings: {
        maxAttempts: 5,
        welcomeBonus: 2,
        welcomeCoins: 50,
        rewards: [100, 75, 50, 25, 10],
    },
    
    referboltSettings: {
        freeAccessWithMockTest: true,
        ibaBonusCommission: 5,
    }
};

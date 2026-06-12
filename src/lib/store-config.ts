
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
    baseDiscount: number;      // Fixed discount for all users
    referralDiscount: number;  // Discount given if an IBA code is used
    specialDiscount: number;   // Extra discount admin can add/remove (e.g. holiday sale)
    grantFreeReferbolt: boolean; // Whether this package grants free ReferBolt access
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

export type RecommendationSettings = {
    additionalDiscount: number;
    windowDays: number;
    requiredCount: number;
};

export type StoreConfig = {
    packages: TicketPackage[];
    mockTestPackages: MockTestPackage[];
    referboltSubscription: ReferboltSubscription;
    referralBonus: number;
    gameSettings: GameSettings;
    referboltSettings: ReferboltSettings;
    recommendationSettings: RecommendationSettings;
    autoApproveDeposits: boolean; // New setting for auto-approval
};

export const defaultStoreConfig: StoreConfig = {
    packages: [],
    
    mockTestPackages: [
        { 
            name: "1 Year Subscription", 
            price: 3000, 
            months: 12, 
            bestValue: true, 
            gstRate: 18, 
            hsnSacCode: '999294',
            baseDiscount: 5,
            referralDiscount: 10,
            specialDiscount: 0,
            grantFreeReferbolt: true
        },
        { 
            name: "6 Months Subscription", 
            price: 1500, 
            months: 6, 
            bestValue: false, 
            gstRate: 18, 
            hsnSacCode: '999294',
            baseDiscount: 5,
            referralDiscount: 10,
            specialDiscount: 0,
            grantFreeReferbolt: true
        },
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
    },

    recommendationSettings: {
        additionalDiscount: 5,
        windowDays: 30,
        requiredCount: 2
    },

    autoApproveDeposits: false // Defaults to manual verification for security
};

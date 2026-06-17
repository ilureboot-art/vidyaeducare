
'use client';

export type MockTestPackage = {
    name: string;
    price: number;
    months: number;
    bestValue: boolean;
    gstRate: number;
    hsnSacCode: string;
    baseDiscount: number;
    referralDiscount: number;
    specialDiscount: number;
    grantFreeReferbolt: boolean;
};

export type ReferboltSubscription = {
    name: string;
    price: number;
    description: string;
    ticketBonus: number;
    gstRate: number;
    hsnSacCode: string;
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

export type GameSettings = {
    maxAttempts: number;
    welcomeBonus: number;
    welcomeCoins: number;
    rewards: number[];
};

export type StoreConfig = {
    packages: any[];
    mockTestPackages: MockTestPackage[];
    referboltSubscription: ReferboltSubscription;
    referralBonus: number;
    gameSettings: GameSettings;
    referboltSettings: ReferboltSettings;
    recommendationSettings: RecommendationSettings;
    autoApproveDeposits: boolean;
    ibaCommissionRate: number;
    aiDoubtSolverPrice: number;
    aiNotesGeneratorPrice: number;
    grantFreeAiToolsWithMockArena: boolean;
};

export const defaultStoreConfig: StoreConfig = {
    packages: [],
    
    mockTestPackages: [
        { 
            name: "1 Year Subscription", 
            price: 7200, 
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
            price: 3600, 
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
        description: "Activate multi-level referral network access.",
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

    autoApproveDeposits: false,
    ibaCommissionRate: 10, // Fixed at 10% as requested
    aiDoubtSolverPrice: 750,
    aiNotesGeneratorPrice: 750,
    grantFreeAiToolsWithMockArena: false
};


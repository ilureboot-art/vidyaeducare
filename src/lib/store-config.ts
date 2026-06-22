
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
    freeAiMonths: number;
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
    companyName?: string;
    companyGstin?: string;
    companyAddress?: string;
    monthlyFirstRankerReward?: number;
    promotionalMessage?: string;
    referralShareMessage?: string;
    ibaShareMessage?: string;
};

export const defaultStoreConfig: StoreConfig = {
    packages: [],
    
    mockTestPackages: [
        { 
            name: "Mock Arena (Mock test) - 1 year subcription", 
            price: 7200, 
            months: 12, 
            bestValue: true, 
            gstRate: 18, 
            hsnSacCode: '999294',
            baseDiscount: 5,
            referralDiscount: 10,
            specialDiscount: 0,
            grantFreeReferbolt: true,
            freeAiMonths: 12
        },
        { 
            name: "Mock Arena (Mock test) - 6 month subcription", 
            price: 3600, 
            months: 6, 
            bestValue: false, 
            gstRate: 18, 
            hsnSacCode: '999294',
            baseDiscount: 5,
            referralDiscount: 10,
            specialDiscount: 0,
            grantFreeReferbolt: true,
            freeAiMonths: 6
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
    grantFreeAiToolsWithMockArena: false,
    companyName: "Vidya EduCare Private Ltd.",
    companyGstin: "27AACCV1234F1Z5",
    companyAddress: "Mumbai, Maharashtra, India",
    monthlyFirstRankerReward: 1000,
    promotionalMessage: `🚀 Ace your academic goals & Earn with Vidya EduCare! 📚

I'm using this elite platform to prepare for success. Here's why you should join:

🏆 MockArena & Quiz Clash: Win REAL cash prizes in live tests!
- MockArena Rewards: Get paid for excellence! Top 5 scorers with 80%+ accuracy win real cash.
- Quiz Clash: Compete in live high-stakes tournaments for rewards.

🤖 Vidya AI Doubt Solver: Your 24/7 personal bilingual tutor for instant clarity.
📝 QuickNotes: Transform textbook chapters into study notes instantly.

💰 Diverse Earning Opportunities:
🤝 IBA Program: Start your zero-investment business earning 10% lifetime commissions!
⚡ ReferBolt System: Unlock powerful passive income cycles.
🎁 Refer & Earn: Every referral gets an instant ₹5 wallet bonus!

Start your journey here: {share_url}
Learn more in our FAQ: {faq_url}

#VidyaEduCare #AcademicExcellence #IBA #PassiveIncome`,
    referralShareMessage: `🎁 Claim your Win-Win Bonus on Vidya EduCare! 🎁

I'm preparing for my exams and winning rewards with Vidya EduCare! Join me using my link and we BOTH get an instant ₹{bonus_amount} wallet bonus!

🚀 Excellence Tools for Students:
🏆 MockArena: Get paid for scoring! Top 5 scorers with 80%+ accuracy win cash.
🏁 Quiz Clash: Live tournaments with shared prize pools.
🤖 Vidya AI Doubt Solver: 24/7 personal bilingual tutor.
📝 QuickNotes: Instant structured summaries.

🔑 My Referral Code: {referral_code}
🔗 Join & Get Bonus: {share_url}

Learn more in our FAQ: {faq_url}

Let's succeed and earn together! 🎓✨`,
    ibaShareMessage: `🎓 Join Vidya EduCare as an Independent Business Associate! 🎓

I'm earning lifetime commissions by empowering students! As an IBA, you unlock:

💰 Massive Commissions: Earn up to 10% on every MockArena subscription.
🏆 MockArena Rewards: Help students win real cash! Top 5 scorers get paid.
⚡ ReferBolt System: Continuous passive income from your network cycles.
🎁 Refer & Earn: Win-Win! Every referral gets an instant ₹5 wallet bonus.
🤖 Vidya AI Doubt Solver: Bilingual AI assistance for all students.

🔑 Start your zero-investment business today!
IBA Code: {referral_code}
🔗 Join: {share_url}

Check out our FAQs: {faq_url}

Let's build success together! 🚀💸`
};


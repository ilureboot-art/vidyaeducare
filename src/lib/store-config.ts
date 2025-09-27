
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

const defaultStoreConfig = {
    packages: [
        { tickets: 1, price: 25, bestValue: false, games: 2, gstRate: 28, hsnSacCode: '998439' },
        { tickets: 5, price: 120, bestValue: false, games: 10, gstRate: 28, hsnSacCode: '998439' },
        { tickets: 10, price: 225, bestValue: true, games: 20, gstRate: 28, hsnSacCode: '998439' },
    ] as TicketPackage[],
    
    mockTestPackages: [
        { name: "1 Year Subscription", price: 3000, months: 12, bestValue: true, gstRate: 18, hsnSacCode: '999294' },
        { name: "6 Months Subscription", price: 1500, months: 6, bestValue: false, gstRate: 18, hsnSacCode: '999294' },
    ] as MockTestPackage[],

    referboltSubscription: {
        name: "ReferBolt",
        price: 100,
        description: "Activate to earn commissions and get a bonus of 4 tickets (worth 8 games).",
        ticketBonus: 4,
        gstRate: 18,
        hsnSacCode: '998314',
    } as ReferboltSubscription,

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

const getStoreConfig = () => {
    if (typeof window === 'undefined') return defaultStoreConfig;
    const savedConfig = localStorage.getItem('storeConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultStoreConfig;
};

const saveStoreConfig = (config: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('storeConfig', JSON.stringify(config));
};

export let storeConfig = getStoreConfig();

if (typeof window !== 'undefined') {
  storeConfig = getStoreConfig();
}


export function setPackages(newPackages: TicketPackage[]) {
    storeConfig.packages = newPackages;
    saveStoreConfig(storeConfig);
}

export function setMockTestPackages(newPackages: MockTestPackage[]) {
    storeConfig.mockTestPackages = newPackages;
    saveStoreConfig(storeConfig);
}

export function setReferboltSubscription(newSub: ReferboltSubscription) {
    storeConfig.referboltSubscription = newSub;
    saveStoreConfig(storeConfig);
}

export function setReferralBonus(newBonus: number) {
    storeConfig.referralBonus = newBonus;
    saveStoreConfig(storeConfig);
}

export function setGameSettings(newSettings: { maxAttempts: number, welcomeBonus: number, rewards: number[], welcomeCoins: number }) {
    storeConfig.gameSettings = newSettings;
    saveStoreConfig(storeConfig);
}

export function setReferboltSettings(newSettings: { freeAccessWithMockTest: boolean, ibaBonusCommission: number }) {
    storeConfig.referboltSettings = newSettings;
    saveStoreConfig(storeConfig);
}

export function resetStoreConfig() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('storeConfig');
    storeConfig = getStoreConfig();
}

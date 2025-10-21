
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

const defaultStoreConfig: StoreConfig = {
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

let storeConfigState: StoreConfig | null = null;

const initializeStoreConfig = (): StoreConfig => {
    if (typeof window === 'undefined') {
        return JSON.parse(JSON.stringify(defaultStoreConfig));
    }
    
    if (storeConfigState) {
        return storeConfigState;
    }
    
    try {
        const savedConfig = localStorage.getItem('storeConfig');
        if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig);
            if (parsedConfig && parsedConfig.packages && parsedConfig.gameSettings) {
                storeConfigState = parsedConfig;
                return storeConfigState;
            }
        }
    } catch (e) {
        console.error("Failed to parse storeConfig from localStorage", e);
    }
    
    storeConfigState = JSON.parse(JSON.stringify(defaultStoreConfig));
    localStorage.setItem('storeConfig', JSON.stringify(storeConfigState));
    return storeConfigState;
};

export const getStoreConfig = (): StoreConfig => {
    return initializeStoreConfig();
};

const saveStoreConfig = (config: StoreConfig) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('storeConfig', JSON.stringify(config));
        storeConfigState = config;
    }
};

export function setPackages(newPackages: TicketPackage[]) {
    const config = getStoreConfig();
    config.packages = newPackages;
    saveStoreConfig(config);
}

export function setMockTestPackages(newPackages: MockTestPackage[]) {
    const config = getStoreConfig();
    config.mockTestPackages = newPackages;
    saveStoreConfig(config);
}

export function setReferboltSubscription(newSub: ReferboltSubscription) {
    const config = getStoreConfig();
    config.referboltSubscription = newSub;
    saveStoreConfig(config);
}

export function setReferralBonus(newBonus: number) {
    const config = getStoreConfig();
    config.referralBonus = newBonus;
    saveStoreConfig(config);
}

export function setGameSettings(newSettings: GameSettings) {
    const config = getStoreConfig();
    config.gameSettings = newSettings;
    saveStoreConfig(config);
}

export function setReferboltSettings(newSettings: ReferboltSettings) {
    const config = getStoreConfig();
    config.referboltSettings = newSettings;
    saveStoreConfig(config);
}

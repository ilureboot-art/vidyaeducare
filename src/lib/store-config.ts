
export type TicketPackage = {
  tickets: number;
  price: number; // Base price before GST
  bestValue: boolean;
  games: number;
  gstRate: number; // GST percentage
  hsnSacCode: string;
};

export type ReferboltSubscription = {
  name: string;
  price: number; // Base price before GST
  description: string;
  ticketBonus: number;
  gstRate: number; // GST percentage
  hsnSacCode: string;
};

export type MockTestSubscription = {
    gstRate: number; // GST percentage
    hsnSacCode: string;
};

// This object acts as our in-memory, shared "database".
// The values can be updated at runtime by the admin panel.
export let storeConfig = {
    packages: [
        { tickets: 1, price: 25, bestValue: false, games: 2, gstRate: 28, hsnSacCode: '998439' },
        { tickets: 5, price: 120, bestValue: false, games: 10, gstRate: 28, hsnSacCode: '998439' },
        { tickets: 10, price: 225, bestValue: true, games: 20, gstRate: 28, hsnSacCode: '998439' },
    ] as TicketPackage[],
    
    referboltSubscription: {
        name: "ReferBolt",
        price: 100,
        description: "Activate to earn commissions and get a bonus of 4 tickets (worth 8 games).",
        ticketBonus: 4,
        gstRate: 18,
        hsnSacCode: '998314',
    } as ReferboltSubscription,
    
    mockTestSubscription: {
        gstRate: 18,
        hsnSacCode: '999294'
    } as MockTestSubscription,

    referralBonus: 5,
};

// --- Setter functions to allow admin panel to modify the config ---

export function setPackages(newPackages: TicketPackage[]) {
    storeConfig.packages = newPackages;
}

export function setReferboltSubscription(newSub: ReferboltSubscription) {
    storeConfig.referboltSubscription = newSub;
}

export function setMockTestSubscription(newSub: MockTestSubscription) {
    storeConfig.mockTestSubscription = newSub;
}

export function setReferralBonus(newBonus: number) {
    storeConfig.referralBonus = newBonus;
}

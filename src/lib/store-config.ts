
export type TicketPackage = {
  tickets: number;
  price: number;
  bestValue: boolean;
  games: number;
};

export type ReferboltSubscription = {
  name: string;
  price: number;
  description: string;
  ticketBonus: number;
};

// This object acts as our in-memory, shared "database".
// The values can be updated at runtime by the admin panel.
export let storeConfig = {
    packages: [
        { tickets: 1, price: 25, bestValue: false, games: 2 },
        { tickets: 5, price: 120, bestValue: false, games: 10 },
        { tickets: 10, price: 225, bestValue: true, games: 20 },
    ] as TicketPackage[],
    
    referboltSubscription: {
        name: "ReferBolt",
        price: 100,
        description: "Activate to earn commissions and get a bonus of 4 tickets (worth 8 games).",
        ticketBonus: 4,
    } as ReferboltSubscription,

    referralBonus: 5,
};

// --- Setter functions to allow admin panel to modify the config ---

export function setPackages(newPackages: TicketPackage[]) {
    storeConfig.packages = newPackages;
}

export function setReferboltSubscription(newSub: ReferboltSubscription) {
    storeConfig.referboltSubscription = newSub;
}

export function setReferralBonus(newBonus: number) {
    storeConfig.referralBonus = newBonus;
}
